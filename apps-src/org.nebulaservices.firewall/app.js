class FirewallApp {
    constructor() {
        this.p2pClient = null;
        this.ports = new Map();
        this.peers = new Map();
        this.expandedPeers = new Set();

        this.initializeElements();
        this.setupEventListeners();
        this.init();
    }

    initializeElements() {
        this.peerIdEl = document.getElementById('peerId');
        this.statusTextEl = document.getElementById('statusText');
        this.statusToggleEl = document.getElementById('statusToggle');
        this.peersListEl = document.getElementById('peersList');
        this.portsListEl = document.getElementById('portsList');
        this.refreshPeersBtn = document.getElementById('refreshPeers');
    }

    setupEventListeners() {
        this.statusToggleEl.addEventListener('change', (e) => {
            this.toggleStatus(e.target.checked);
        });

        this.refreshPeersBtn.addEventListener('click', () => {
            this.refreshPeers();
        });

        setInterval(() => {
            this.updatePorts();
        }, 1000);

        setInterval(() => {
            this.updatePeersList();
        }, 2000);
    }

    async init() {

        this.p2pClient = parent.xen.p2p;
        this.peerIdEl.textContent = this.p2pClient.peer.id;
        this.updateStatus();
        this.updatePorts();
    }

    toggleStatus(online) {
        if (!this.p2pClient) return;

        const status = online ? 'online' : 'offline';
        this.p2pClient.setStatus(status);
        this.updateStatus();
    }

    updateStatus() {
        if (!this.p2pClient) return;

        const isOnline = this.p2pClient.peer && this.statusToggleEl.checked;

        this.statusTextEl.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
        this.statusTextEl.className = `status-text ${isOnline ? 'online' : 'offline'}`;
    }

    updatePorts() {
        if (!parent.xen?.net?.loopback?.resolver) return;

        const currentPorts = Object.keys(parent.xen.net.loopback.resolver).map(Number);
        const portsChanged = !this.arraysEqual(
            Array.from(this.ports.keys()).sort(),
            currentPorts.sort()
        );

        if (portsChanged) {
            currentPorts.forEach(port => {
                if (!this.ports.has(port)) {
                    this.ports.set(port, { port, description: '' });
                }
            });

            Array.from(this.ports.keys()).forEach(port => {
                if (!currentPorts.includes(port)) {
                    this.ports.delete(port);
                    if (this.p2pClient) {
                        this.p2pClient.unforward(port);
                    }
                }
            });

            this.renderPorts();
        }
    }

    renderPorts() {
        if (this.ports.size === 0) {
            this.portsListEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plug"></i>
                    <p>No ports forwarded</p>
                </div>
            `;
            return;
        }

        const portsArray = Array.from(this.ports.values()).sort((a, b) => a.port - b.port);

        this.portsListEl.innerHTML = portsArray.map(portData => `
            <div class="port-card">
                <div class="port-number-large">${portData.port}</div>
                <div class="port-description ${portData.description ? 'has-description' : ''}" 
                     onclick="app.editPortDescription(${portData.port})">
                    ${portData.description || 'Add a description...'}
                </div>
                <div class="port-toggle">
                    <label class="switch">
                        <input type="checkbox" ${portData.forwarded ? 'checked' : ''} 
                               onchange="app.togglePortForwarding(${portData.port}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `).join('');
    }

    async editPortDescription(port) {
        const currentDescription = this.ports.get(port)?.description || '';

        try {
            const newDescription = await parent.xen.dialog.prompt({
                title: 'Edit Port Description',
                body: `Enter a description for port ${port}:`,
                placeholder: currentDescription || 'Enter description...'
            });

            if (newDescription !== null) {
                const portData = this.ports.get(port);
                if (portData) {
                    portData.description = newDescription;
                    this.renderPorts();

                    if (portData.forwarded && this.p2pClient) {
                        this.p2pClient.forward(port, newDescription);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to edit port description:', error);
        }
    }

    togglePortForwarding(port, forwarded) {
        const portData = this.ports.get(port);
        if (!portData || !this.p2pClient) return;

        portData.forwarded = forwarded;

        if (forwarded) {
            this.p2pClient.forward(port, portData.description);
        } else {
            this.p2pClient.unforward(port);
        }
    }

    refreshPeers() {
        if (!this.p2pClient) return;

        this.p2pClient.refreshPeerList();

        this.refreshPeersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        setTimeout(() => {
            this.refreshPeersBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 1000);
    }

    updatePeersList() {
        if (!this.p2pClient) return;

        const currentPeers = this.p2pClient.getPeers();
        const currentPeerIds = new Set(currentPeers.map(p => p.id));
        const cachedPeerIds = new Set(this.peers.keys());

        const peersChanged =
            currentPeerIds.size !== cachedPeerIds.size ||
            !Array.from(currentPeerIds).every(id => cachedPeerIds.has(id));

        if (peersChanged) {
            this.peers.clear();
            currentPeers.forEach(peer => {
                if (peer.id && typeof peer.id === 'string') {
                    this.peers.set(peer.id, peer);
                }
            });

            this.renderPeers();
        }
    }

    renderPeers() {
        if (this.peers.size === 0) {
            this.peersListEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No peers connected</p>
                </div>
            `;
            return;
        }

        const peersArray = Array.from(this.peers.values());

        this.peersListEl.innerHTML = peersArray.map(peer => {
            const isExpanded = this.expandedPeers.has(peer.id);
            const avatar = peer.id.charAt(0).toUpperCase();

            return `
                <div class="peer-card ${isExpanded ? 'expanded' : ''}">
                    <div class="peer-header" onclick="app.togglePeerExpansion('${peer.id}')">
                        <div class="peer-info-card">
                            <div class="peer-avatar">${avatar}</div>
                            <div class="peer-details">
                                <h4>${peer.id}</h4>
                                <p>${peer.ports.length} port${peer.ports.length !== 1 ? 's' : ''} forwarded</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right expand-icon"></i>
                    </div>
                    <div class="peer-ports">
                        ${peer.ports.map(port => `
                            <div class="port-item">
                                <div class="port-number">${port.port}</div>
                                <span>${port.description || 'No description'}</span>
                            </div>
                        `).join('')}
                        ${peer.ports.length === 0 ? '<div class="port-item">No ports forwarded</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    togglePeerExpansion(peerId) {
        if (this.expandedPeers.has(peerId)) {
            this.expandedPeers.delete(peerId);
        } else {
            this.expandedPeers.add(peerId);
        }
        this.renderPeers();
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }
}

const app = new FirewallApp();
