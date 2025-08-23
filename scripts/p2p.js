import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

class P2PSignalingServer {
    constructor() {
        this.peers = new Map(); // id -> { ws, peer }
        this.wss = null;
        this.logPath = path.join(process.cwd(), 'p2p.json');
        this.cleanupInterval = null;
        this.initializeJsonLog();
    }

    initializeJsonLog() {
        try {
            if (fs.existsSync(this.logPath)) {
                const content = fs.readFileSync(this.logPath, 'utf8');
                if (content.trim()) {
                    JSON.parse(content);
                }
            } else {
                fs.writeFileSync(this.logPath, JSON.stringify({ logs: [] }, null, 2));
            }
        } catch {
            fs.writeFileSync(this.logPath, JSON.stringify({ logs: [] }, null, 2));
        }
    }

    routeRequest({ request, socket, head, conf = {} }) {
        const { logging = false, blockedIps = [] } = conf;

        // CFCIP -> XFF -> RIP
        const ip = this.getClientIP(request, socket);
        
        if (logging) {
            this.log('Connection attempt', 'connection', { ip });
        }

        if (blockedIps.includes(ip)) {
            if (logging) {
                this.log('Blocked connection attempt', 'security', { ip });
            }

            socket.destroy();
            return;
        }

        if (!this.wss) {
            this.wss = new WebSocket.Server({ noServer: true });
            this.setupWebSocketServer(logging);
            
            if (!this.cleanupInterval) {
                this.cleanupInterval = setInterval(() => {
                    this.cleanupStaleConnections(logging);
                }, 60000);
            }
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
        });
    }

    getClientIP(request, socket) {
        if (request.headers['cf-connecting-ip']) {
            return request.headers['cf-connecting-ip'];
        }
        
        if (request.headers['x-forwarded-for']) {
            return request.headers['x-forwarded-for'].split(',')[0].trim();
        }
        
        return socket.remoteAddress;
    }

    setupWebSocketServer(logging) {
        this.wss.on('connection', (ws) => {
            let peerId = null;
  
            if (logging) {
                this.log('WebSocket connection established', 'connection');
            }

            this.cleanupStaleConnections(logging);

            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message, logging);
                    
                    if (message.type === 'peer-update') {
                        const incomingPeerId = message.data.id;
                        const existingPeer = this.peers.get(incomingPeerId);
                    
                        if (existingPeer && existingPeer.ws !== ws) {
                            if (existingPeer.ws.readyState === WebSocket.OPEN) {
                                existingPeer.ws.close();
                            }

                            if (logging) {
                                this.log('Replacing stale connection', 'peer_management', { 
                                    peerId: incomingPeerId 
                                });
                            }
                        }

                        peerId = incomingPeerId;
                        this.peers.set(peerId, { ws, peer: message.data });

                        if (logging) {
                            this.log('Peer registered/updated', 'peer_management', {
                                peerId,
                                ports: message.data.ports || []
                            });
                        }

                        this.broadcastPeerList();
                    }
                } catch (err) {
                    if (logging) {
                        this.log('Failed to parse message', 'error', { 
                            error: err.message,
                            rawData: data.toString().substring(0, 100)
                        });
                    }
                }
            });

            ws.on('close', (code, reason) => {
                if (peerId && this.peers.has(peerId)) {
                    this.peers.delete(peerId);

                    if (logging) {
                        this.log('Peer disconnected', 'connection', { 
                            peerId, 
                            code, 
                            reason: reason.toString() 
                        });
                    }

                    this.broadcastPeerList();   
                    this.broadcastPeerDisconnect(peerId);
                }
            });

            ws.on('error', (err) => {
                if (logging) {
                    this.log('WebSocket error', 'error', { 
                        error: err.message,
                        peerId: peerId || 'unknown'
                    });
                }
            });

            this.sendPeerList(ws);
        });
        
        const pingInterval = setInterval(() => {
            if (!this.wss) {
                clearInterval(pingInterval);
                return;
            }
            
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    if (logging) {
                        this.log('Terminating unresponsive connection', 'cleanup');
                    }
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping(() => {});
            });
        }, 60000);
    }

    handleMessage(ws, message, logging) {
        switch (message.type) {
            case 'peer-update':
                this.handlePeerUpdate(ws, message, logging);
                break;

            case 'offer':
            case 'answer':
            case 'ice-candidate':
                this.relayMessage(message, logging);
                break;
                
            case 'peer-list-request':
                this.sendPeerList(ws);
                break;

            default:
                if (logging) {
                    this.log('Unknown message type received', 'warning', { 
                        messageType: message.type,
                        from: message.from
                    });
                }
        }
    }

    handlePeerUpdate(ws, message, logging) {
        const peer = message.data;
        const existingPeer = this.peers.get(peer.id);
        
        if (!existingPeer || JSON.stringify(existingPeer.peer) !== JSON.stringify(peer)) {
            this.peers.set(peer.id, { ws, peer });
            
            if (logging) {
                this.log('Peer data updated', 'peer_management', {
                    peerId: peer.id,
                    ports: peer.ports || [],
                    portCount: (peer.ports || []).length
                });
            }
            
            this.broadcastPeerList();
        }
    }

    relayMessage(message, logging) {
        if (message.to) {
            const targetPeer = this.peers.get(message.to);

            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
                targetPeer.ws.send(JSON.stringify(message));

                if (logging) {
                    this.log('Message relayed', 'relay', {
                        messageType: message.type,
                        from: message.from,
                        to: message.to
                    });
                }
            }
        }
    }

    broadcastPeerList() {
        const peerList = Array.from(this.peers.values()).map(({ peer }) => peer);
        const message = JSON.stringify({
            type: 'peer-list',
            data: peerList
        });

        this.peers.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    broadcastPeerDisconnect(peerId) {
        const message = JSON.stringify({
            type: 'peer-disconnect',
            data: { peerId }
        });

        this.peers.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    sendPeerList(ws) {
        const peerList = Array.from(this.peers.values()).map(({ peer }) => peer);
        const message = JSON.stringify({
            type: 'peer-list',
            data: peerList
        });

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    }

    cleanupStaleConnections(logging) {
        const stalePeers = [];
        
        this.peers.forEach((peerData, peerId) => {
            const ws = peerData.ws;
            if (ws.readyState === WebSocket.CLOSED || 
                ws.readyState === WebSocket.CLOSING ||
                ws.isAlive === false) {
                stalePeers.push(peerId);
            }
        });
        
        stalePeers.forEach(peerId => {
            const peerData = this.peers.get(peerId);
            if (peerData && peerData.ws.readyState === WebSocket.OPEN) {
                peerData.ws.terminate();
            }
            this.peers.delete(peerId);
            
            if (logging) {
                this.log('Cleaned up stale peer', 'cleanup', { peerId });
            }
        });
        
        if (stalePeers.length > 0) {
            this.broadcastPeerList();
            stalePeers.forEach(peerId => {
                this.broadcastPeerDisconnect(peerId);
            });
        }
    }

    log(message, type = 'info', data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            data,
            peerCount: this.peers.size
        };

        console.log(`[${timestamp}] P2P: ${message}`);
        
        try {
            const logFile = fs.readFileSync(this.logPath, 'utf8');
            const logData = JSON.parse(logFile);
            
            logData.logs.push(logEntry);
            
            if (logData.logs.length > 1000) {
                logData.logs = logData.logs.slice(-1000);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(logData, null, 2));
        } catch (err) {
            console.error('Failed to write to JSON log file:', err.message);
            try {
                const newLogData = {
                    logs: [logEntry]
                };
                fs.writeFileSync(this.logPath, JSON.stringify(newLogData, null, 2));
            } catch (fallbackErr) {
                console.error('Failed to recreate log file:', fallbackErr.message);
            }
        }
    }

    getLogs(filter = {}) {
        try {
            const logFile = fs.readFileSync(this.logPath, 'utf8');
            const logData = JSON.parse(logFile);
            let logs = logData.logs;

            if (filter.type) {
                logs = logs.filter(log => log.type === filter.type);
            }
            if (filter.since) {
                const sinceDate = new Date(filter.since);
                logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
            }
            if (filter.peerId) {
                logs = logs.filter(log => 
                    log.data.peerId === filter.peerId || 
                    log.data.from === filter.peerId || 
                    log.data.to === filter.peerId
                );
            }
            if (filter.limit) {
                logs = logs.slice(-filter.limit);
            }

            return logs;
        } catch (err) {
            console.error('Failed to read logs:', err.message);
            return [];
        }
    }

    getLogStats() {
        try {
            const logs = this.getLogs();
            const stats = {
                totalEntries: logs.length,
                byType: {},
                timeRange: {
                    oldest: logs.length > 0 ? logs[0].timestamp : null,
                    newest: logs.length > 0 ? logs[logs.length - 1].timestamp : null
                },
                currentPeerCount: this.peers.size
            };

            // Count by type
            logs.forEach(log => {
                stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
            });

            return stats;
        } catch (err) {
            console.error('Failed to get log stats:', err.message);
            return null;
        }
    }
}

export default new P2PSignalingServer();
