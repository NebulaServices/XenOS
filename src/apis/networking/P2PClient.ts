export type Status = 'online' | 'offline';

export interface Peer {
    id: string;
    ports: Array<{ port: number; description?: string }>;
}

interface P2PMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'peer-list' | 'port-forward' | 'port-unforward' | 'peer-update' | 'peer-disconnect' | 'peer-list-request';
    data: any;
    from?: string;
    to?: string;
}

export class P2PClient {
    private ws: WebSocket | null = null;
    private status: Status = 'offline';
    private url: string = '';
    private peerId: string = '';
    private forwardedPorts: Array<{ port: number; description?: string }> = [];
    private peers: Map<string, Peer> = new Map();
    private connections: Map<string, RTCPeerConnection> = new Map();
    private channels: Map<string, RTCDataChannel> = new Map();
    private p2pUrl: string = '';
    private reconnectAttempts: number = 0;

    public async init(): Promise<void> {
        if (!this.peerId) {
            this.peerId = this.genId();
        }
        
        this.p2pUrl = window.xen.settings.get('p2p-url');

        if (!this.p2pUrl) {
            window.xen.settings.set('p2p-url', (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/p2p/");
            this.p2pUrl = window.xen.settings.get('p2p-url');
        }
        
        this.setUrl(this.p2pUrl);
        this.setStatus('online');
    }

    private genId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        return (timestamp + random).substr(0, 9);
    }

    public setStatus(status: Status): void {
        const wasOnline = this.status === 'online';
        this.status = status;

        if (status === 'online' && this.url && !wasOnline) {
            this.connect();
        } else if (status === 'offline') {
            this.disconnect();
        }
    }

    public setUrl(url: string): void {
        const wasConnected = this.ws?.readyState === WebSocket.OPEN;
        this.url = url;

        if (this.status === 'online' && !wasConnected) {
            this.connect();
        }
    }

    public get peer(): Peer {
        return {
            id: this.peerId,
            ports: this.forwardedPorts
        };
    }

    public forward(port: number, desc?: string): void {
        const existing = this.forwardedPorts.findIndex(p => p.port === port);

        if (existing >= 0) {
            this.forwardedPorts[existing].description = desc;
        } else {
            this.forwardedPorts.push({ port, description: desc });
        }
        
        this.broadcast();
    }

    public unforward(port: number): void {
        this.forwardedPorts = this.forwardedPorts.filter(p => p.port !== port);
        this.broadcast();
    }

    public getPeers(): Peer[] {
        return Array.from(this.peers.values());
    }

    private connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                this.sendMessage({
                    type: 'peer-update',
                    data: this.peer
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: P2PMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (err) {
                    console.error('[P2P] Failed to parse message:', err);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[P2P] Disconnected from signaling server:', event.code, event.reason);

                if (event.code !== 1000) {
                    this.peers.clear();
                }
                
                const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts || 0), 30000);

                setTimeout(() => {
                    if (this.status === 'online') {
                        this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
                        this.connect();
                    }
                }, delay);
            };

            this.ws.onerror = (err) => {
                console.error('[P2P] WS error:', err);
            };

            this.reconnectAttempts = 0;
            
        } catch (err) {
            console.error('[P2P] Failed to connect:', err);
        }
    }

    private disconnect(): void {
        console.log('[P2P] Disconnecting from signaling server');
        this.reconnectAttempts = 0;
        
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        
        this.connections.forEach((conn) => {
            conn.close();
        });

        this.connections.clear();
        this.channels.clear();
        this.peers.clear();
    }

    private sendMessage(message: P2PMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const messageWithFrom = {
                ...message,
                from: this.peerId
            };
            this.ws.send(JSON.stringify(messageWithFrom));
        }
    }

    private async handleMessage(message: P2PMessage): Promise<void> {
        switch (message.type) {
            case 'peer-list':
                this.updatePeerList(message.data);
                break;
            case 'peer-disconnect':
                this.handlePeerDisconnect(message.data.peerId);
                break;
            case 'offer':
                await this.handleOffer(message);
                break;
            case 'answer':
                await this.handleAnswer(message);
                break;
            case 'ice-candidate':
                await this.handleIceCandidate(message);
                break;
            case 'peer-update':
                this.updatePeer(message.data);
                break;
        }
    }

    private updatePeerList(peers: Peer[]): void {
        this.peers.clear();

        peers.forEach(peer => {
            if (peer.id && peer.id !== this.peerId && typeof peer.id === 'string') {
                this.peers.set(peer.id, peer);
            }
        });
    }

    private updatePeer(peer: Peer): void {
        if (peer.id && peer.id !== this.peerId && typeof peer.id === 'string') {
            this.peers.set(peer.id, peer);
        }
    }

    private handlePeerDisconnect(peerId: string): void {
        console.log(`[P2P] ${peerId} disconnected`);
        
        this.peers.delete(peerId);
        const connection = this.connections.get(peerId);

        if (connection) {
            connection.close();
            this.connections.delete(peerId);
        }
        
        const channel = this.channels.get(peerId);

        if (channel) {
            channel.close();
            this.channels.delete(peerId);
        }
    }

    private async createConf(peerId: string): Promise<RTCPeerConnection> {
        const config: RTCConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        const pc = new RTCPeerConnection(config);
        this.connections.set(peerId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'ice-candidate',
                    data: event.candidate,
                    to: peerId
                });
            }
        };

        pc.ondatachannel = (event) => {
            const channel = event.channel;
    
            this.channels.set(peerId, channel);
            this.setupChannel(channel, peerId);
        };

        return pc;
    }

    private setupChannel(channel: RTCDataChannel, peerId: string): void {
        channel.onmessage = async (event) => {
            try {
                const request = JSON.parse(event.data);
                const response = await this.handleReq(request);

                channel.send(JSON.stringify(response));
            } catch (err) {
                console.error('[P2P] Failed to handle request:', err);

                const requestId = (() => {
                    try {
                        return JSON.parse(event.data).id;
                    } catch {
                        return 'unknown';
                    }
                })();
                
                channel.send(JSON.stringify({
                    id: requestId,
                    status: 500,
                    statusText: 'Internal Server Error',
                    headers: {},
                    body: 'Internal server error',
                    error: err instanceof Error ? err.message : 'Unknown error'
                }));
            }
        };

        channel.onclose = () => {
            console.log(`[P2P] Data channel closed with ${peerId}`);
            this.channels.delete(peerId);
        };

        channel.onerror = (err) => {
            console.error(`[P2P] Data channel error with ${peerId}:`, err);
        };
    }

    private async handleOffer(message: P2PMessage): Promise<void> {
        const pc = await this.createConf(message.from!);
        await pc.setRemoteDescription(message.data);
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendMessage({
            type: 'answer',
            data: answer,
            to: message.from!
        });
    }

    private async handleAnswer(message: P2PMessage): Promise<void> {
        const pc = this.connections.get(message.from!);

        if (pc) {
            await pc.setRemoteDescription(message.data);
        }
    }

    private async handleIceCandidate(message: P2PMessage): Promise<void> {
        const pc = this.connections.get(message.from!);

        if (pc) {
            await pc.addIceCandidate(message.data);
        }
    }

    private async handleReq(request: any): Promise<any> {
        try {
            const { url, method, headers, body, id } = request;
            const urlObj = new URL(url);
            const port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
            const isPortForwarded = this.forwardedPorts.some(p => p.port === port);
            
            if (!isPortForwarded) {
                return {
                    id,
                    status: 404,
                    statusText: 'Not Found',
                    headers: {},
                    body: 'Port not forwarded'
                };
            }
    
            if (window.xen?.net?.loopback?.resolver?.[port]) {
                const req = new Request(url, {
                    method,
                    headers: headers ? new Headers(headers) : undefined,
                    body: body ? JSON.stringify(body) : undefined
                });
                
                const response = await window.xen.net.loopback.call(port, req);
                
                return {
                    id,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: await response.text()
                };
            } else {
                return {
                    id,
                    status: 404,
                    statusText: 'Not Found',
                    headers: {},
                    body: 'Port not forwarded'
                };
            }
        } catch (err) {
            return {
                id: request.id,
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                body: err instanceof Error ? err.message : 'Unknown error'
            };
        }
    }

    private broadcast(): void {
        this.sendMessage({
            type: 'peer-update',
            data: this.peer
        });
    }

    public async connectPeer(peerId: string): Promise<void> {
        if (this.connections.has(peerId)) {
            return;
        }

        if (!this.peers.has(peerId)) {
            throw new Error(`Peer ${peerId} not found`);
        }

        const pc = await this.createConf(peerId);
        const channel = pc.createDataChannel('p2p', { ordered: true });

        this.channels.set(peerId, channel);
        this.setupChannel(channel, peerId);

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            this.sendMessage({
                type: 'offer',
                data: offer,
                to: peerId
            });
        } catch (err) {
            console.error(`[P2P] Failed to create offer for ${peerId}:`, err);

            this.connections.delete(peerId);
            this.channels.delete(peerId);

            pc.close();
            throw err;
        }
    }

    public refreshPeerList(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'peer-list-request',
                data: {}
            });
        }
    }

    public async fetch(peerId: string, url: string, options?: RequestInit): Promise<Response> {
        const peer = this.peers.get(peerId);

        if (!peer) {
            throw new Error(`Peer ${peerId} not found`);
        }

        const urlObj = new URL(url);
        const port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
        const isPortAvailable = peer.ports.some(p => p.port === port);

        if (!isPortAvailable) {
            return new Response('Port not forwarded by target peer', {
                status: 404,
                statusText: 'Not Found'
            });
        }

        if (!this.channels.has(peerId)) {
            await this.connectPeer(peerId);
        }

        const channel = await this.waitForConnection(peerId);

        if (!channel || channel.readyState !== 'open') {
            throw new Error(`Failed to establish connection to peer ${peerId}`);
        }

        const requestId = Math.random().toString(36).substr(2, 9);

        const request = {
            id: requestId,
            url,
            method: options?.method || 'GET',
            headers: options?.headers,
            body: options?.body
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 30000);

            const handleMessage = (event: MessageEvent) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.id === requestId) {
                        clearTimeout(timeout);
                        channel.removeEventListener('message', handleMessage);
                        
                        if (response.error) {
                            reject(new Error(response.error));
                        } else {
                            resolve(new Response(response.body, {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            }));
                        }
                    }
                } catch { }
            };

            channel.addEventListener('message', handleMessage);
            channel.send(JSON.stringify(request));
        });
    }

    private async waitForConnection(peerId: string, timeoutMs: number = 10000): Promise<RTCDataChannel | null> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, timeoutMs);

            const checkConnection = () => {
                const channel = this.channels.get(peerId);

                if (channel?.readyState === 'open') {
                    clearTimeout(timeout);
                    resolve(channel);
                } else if (channel?.readyState === 'closed' || channel?.readyState === 'closing') {
                    clearTimeout(timeout);
                    reject(new Error('Connection closed'));
                } else {
                    setTimeout(checkConnection, 100);
                }
            };
            
            checkConnection();
        });
    }
}
