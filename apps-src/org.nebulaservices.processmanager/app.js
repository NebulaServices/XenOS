class TaskManager {
    constructor() {
        this.pm = parent.xen.process;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.startAutoRefresh();
        this.refresh();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => this.refresh());
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => this.refresh(), 2000);
    }

    showDebugInfo() {
        /*
        let wID = 0;

        parent.xen.wm.windows.forEach((win, index) => {
            if (win.el.content.contentWindow.location.href === location.href) {
                wID = index;
                return;
            }
        });

        const win = parent.xen.wm.windows[wID].el.content;
        const tWin = parent.xen.wm.create({ url: 'https://example.com' });

        tWin.el.content.addEventListener('load', () => {
            win.contentWindow.ChiiDevtoolsIframe = tWin.el.content;

            const script = document.createElement('script');
            script.src = '/chii/target.js';
            script.setAttribute('embedded', 'true');

            script.onload = () => {
                window.addEventListener('message', (ev) => {
                    if (ev.source !== win.contentWindow) {
                        win.contentWindow.postMessage(ev.data, ev.origin);
                    }
                });
            };

            win.contentDocument.body.appendChild(script);
        });
        */
       alert('wip');
    }
    formatMemory(bytes) {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    killProcess(pid) {
        if (!this.pm) return;
        this.pm.kill(pid);
        this.refresh();
    }

    refresh() {
        if (!this.pm) {
            this.showNoProcessManager();
            return;
        }

        const processes = this.pm.list();
        this.renderProcesses(processes);
        this.updateStats(processes);
    }

    showNoProcessManager() {
        const tbody = document.getElementById('processTable');
        tbody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Process Manager not available</div>
            </div>
        `;

        document.getElementById('processCount').textContent = '0 processes';
        document.getElementById('totalMemory').textContent = '0 KB total';
    }

    renderProcesses(processes) {
        const tbody = document.getElementById('processTable');

        if (processes.length === 0) {
            tbody.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <div>No processes running</div>
                </div>
            `;
            return;
        }

        tbody.innerHTML = processes.map(proc => `
            <div class="process-row">
                <div class="col pid">${proc.pid}</div>
                <div class="col status">
                    <span class="status-badge status-${proc.status}">
                        ${proc.status}
                    </span>
                </div>
                <div class="col memory">${this.formatMemory(proc.memory)}</div>
                <div class="col start-time">${this.formatTime(proc.startTime)}</div>
                <div class="col actions">
                    <button 
                        class="kill-btn" 
                        onclick="taskManager.killProcess(${proc.pid})"
                        ${proc.status === 'terminated' ? 'disabled' : ''}
                    >
                        <i class="fas fa-times"></i>
                    </button>
                    <button 
                        class="debug-btn" 
                        onclick="taskManager.showDebugInfo(${proc.pid})"
                    >
                        <i class="fas fa-bug"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats(processes) {
        const running = processes.filter(p => p.status === 'running').length;
        const total = processes.length;
        const totalMem = processes.reduce((sum, p) => sum + (p.memory || 0), 0);

        document.getElementById('processCount').textContent =
            `${total} process${total !== 1 ? 'es' : ''} (${running} running)`;
        document.getElementById('totalMemory').textContent =
            `${this.formatMemory(totalMem)} total`;
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

const taskManager = new TaskManager();

window.addEventListener('beforeunload', () => {
    taskManager.destroy();
});