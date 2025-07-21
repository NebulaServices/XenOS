import { PackageManager } from '../../apis/packages/PackageManager';
import { Manifest } from '../../apis/packages/PackageManager';

interface DragState {
    isDragging: boolean;
    draggedElement: HTMLElement | null;
    draggedAppId: string | null;
    dragOffset: { x: number; y: number };
    placeholder: HTMLElement | null;
}

export class AppLauncher {
    private el: {
        launcher: HTMLDivElement;
        searchContainer: HTMLDivElement;
        searchInput: HTMLInputElement;
        grid: HTMLDivElement;
    };

    private isVisible = false;
    private apps: Manifest[] = [];
    private appOrder: string[] = [];
    private dragState: DragState = {
        isDragging: false,
        draggedElement: null,
        draggedAppId: null,
        dragOffset: { x: 0, y: 0 },
        placeholder: null
    };

    constructor(
        private packageManager: PackageManager,
        private launcher: HTMLElement,
        private taskbar: HTMLElement,
    ) {
        this.el = {
            launcher: document.createElement('div'),
            searchContainer: document.createElement('div'),
            searchInput: document.createElement('input'),
            grid: document.createElement('div'),
        };

        this.setup();
        this.loadAppOrder();
    }

    private setup(): void {
        this.el.launcher.id = 'app-launcher';
        this.el.launcher.classList.add('app-launcher');
        this.el.searchContainer.classList.add('launcher-search-container');
        this.el.searchInput.type = 'text';
        this.el.searchInput.placeholder = 'Search your apps!';
        this.el.searchInput.classList.add('launcher-search-input');
        
        this.el.searchContainer.innerHTML = `
            <svg class="launcher-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
        `;
        this.el.searchContainer.appendChild(this.el.searchInput);
        this.el.launcher.appendChild(this.el.searchContainer);
        this.el.grid.classList.add('app-grid');
        this.el.launcher.appendChild(this.el.grid);
        this.el.searchInput.addEventListener('input', () => this.filterApps());
    }

    public create(): void { document.body.appendChild(this.el.launcher); }
    public toggle(): void { this.isVisible ? this.hide() : this.show(); }

    public async show(): Promise<void> {
        if (this.isVisible) return;
        this.isVisible = true;

        const taskbarRect = this.taskbar.getBoundingClientRect();

        this.el.launcher.style.left = `${taskbarRect.left}px`;
        this.el.launcher.style.bottom = `${window.innerHeight - taskbarRect.top + 8}px`;
        this.el.launcher.classList.add('visible');
        this.apps = await this.packageManager.listApps();
        this.renderApps();
        this.el.searchInput.focus();

        setTimeout(() => document.addEventListener('click', this.handleClick), 0);
    }

    public hide(): void {
        if (!this.isVisible) return;
        this.isVisible = false;
    
        this.el.launcher.classList.remove('visible');
        document.removeEventListener('click', this.handleClick);

        setTimeout(() => {
            if (!this.isVisible) {
                this.el.searchInput.value = '';
                this.el.grid.innerHTML = '';
            }
        }, 300);
    }

    private handleClick = (e: MouseEvent): void => {
        const path = e.composedPath();

        if (
            !path.includes(this.el.launcher) &&
            !path.includes(this.launcher)
        ) {
            this.hide();
        }
    };

    private filterApps(): void {
        const query = this.el.searchInput.value.toLowerCase();
        if (query) {
            const filtered = this.apps.filter((app) => 
                app.title.toLowerCase().includes(query)
            );
            this.renderFilteredApps(filtered);
        } else {
            this.renderApps();
        }
    }

    private renderApps(): void {
        this.el.grid.innerHTML = '';
        
        try {
            const orderedApps = this.getOrderedApps();
            
            orderedApps.forEach((app, index) => {
                const entry = this.createAppEntry(app);
                (entry.style as any).transitionDelay = `${index * 20}ms`;
                this.el.grid.appendChild(entry);
            });
        } catch (err) {
            console.error('Failed to render apps:', err);
        }
    }

    private renderFilteredApps(apps: Manifest[]): void {
        this.el.grid.innerHTML = '';
        
        try {
            apps.forEach((app, index) => {
                const entry = this.createAppEntry(app);
                (entry.style as any).transitionDelay = `${index * 20}ms`;
                this.el.grid.appendChild(entry);
            });
        } catch (err) {
            console.error('Failed to render apps:', err);
        }
    }

    private createAppEntry(app: Manifest): HTMLDivElement {
        const entry = document.createElement('div');
        entry.classList.add('app-entry');
        entry.title = app.title;
        entry.dataset.appId = app.id;
        entry.draggable = true;

        const icon = document.createElement('img');
        icon.src = `/fs/apps/${app.id}/${app.icon}`;
        icon.alt = app.title;

        const name = document.createElement('span');
        name.textContent = app.title;

        entry.appendChild(icon);
        entry.appendChild(name);

        this.setupDragEvents(entry, app.id);

        entry.addEventListener('click', (e) => {
            if (!this.dragState.isDragging) {
                this.packageManager.open(app.id);
                this.hide();
            }
        });

        return entry;
    }

    private setupDragEvents(entry: HTMLElement, appId: string): void {
        entry.addEventListener('dragstart', (e) => {
            this.dragState.isDragging = true;
            this.dragState.draggedElement = entry;
            this.dragState.draggedAppId = appId;
            
            const rect = entry.getBoundingClientRect();
            this.dragState.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            entry.classList.add('dragging');
            e.dataTransfer!.effectAllowed = 'move';
            e.dataTransfer!.setData('text/plain', appId);
        });

        entry.addEventListener('dragend', () => {
            this.dragState.isDragging = false;
            this.dragState.draggedElement = null;
            this.dragState.draggedAppId = null;
            entry.classList.remove('dragging');
            this.removePlaceholder();
        });

        entry.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.dragState.draggedAppId && this.dragState.draggedAppId !== appId) {
                this.handleDragOver(entry, e);
            }
        });

        entry.addEventListener('dragleave', () => {
            entry.classList.remove('drop-target');
        });

        entry.addEventListener('drop', (e) => {
            e.preventDefault();
            entry.classList.remove('drop-target');
            
            if (this.dragState.draggedAppId && this.dragState.draggedAppId !== appId) {
                this.reorderApps(this.dragState.draggedAppId, appId);
            }
        });
    }

    private handleDragOver(targetEntry: HTMLElement, e: DragEvent): void {
        const rect = targetEntry.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertBefore = e.clientY < midY;
        
        targetEntry.classList.add('drop-target');
        
        if (insertBefore) {
            targetEntry.classList.add('drop-before');
            targetEntry.classList.remove('drop-after');
        } else {
            targetEntry.classList.add('drop-after');
            targetEntry.classList.remove('drop-before');
        }
    }

    private reorderApps(draggedAppId: string, targetAppId: string): void {
        const orderedApps = this.getOrderedApps();
        const draggedIndex = orderedApps.findIndex(app => app.id === draggedAppId);
        const targetIndex = orderedApps.findIndex(app => app.id === targetAppId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const [draggedApp] = orderedApps.splice(draggedIndex, 1);
        const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        orderedApps.splice(newTargetIndex, 0, draggedApp);
        
        this.appOrder = orderedApps.map(app => app.id);
        this.saveAppOrder();
        this.renderApps();
    }

    private getOrderedApps(): Manifest[] {
        if (this.appOrder.length === 0) {
            return [...this.apps];
        }
        
        const ordered: Manifest[] = [];
        const unordered: Manifest[] = [];
        
        this.appOrder.forEach(appId => {
            const app = this.apps.find(a => a.id === appId);
            if (app) ordered.push(app);
        });
        
        this.apps.forEach(app => {
            if (!this.appOrder.includes(app.id)) {
                unordered.push(app);
            }
        });
        
        return [...ordered, ...unordered];
    }

    private removePlaceholder(): void {
        if (this.dragState.placeholder) {
            this.dragState.placeholder.remove();
            this.dragState.placeholder = null;
        }
        
        this.el.grid.querySelectorAll('.drop-target, .drop-before, .drop-after').forEach(el => {
            el.classList.remove('drop-target', 'drop-before', 'drop-after');
        });
    }

    private saveAppOrder(): void {
        localStorage.setItem('app-launcher-order', JSON.stringify(this.appOrder));
    }

    private loadAppOrder(): void {
        const saved = localStorage.getItem('app-launcher-order');
        if (saved) {
            try {
                this.appOrder = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load app order:', e);
                this.appOrder = [];
            }
        }
    }
}