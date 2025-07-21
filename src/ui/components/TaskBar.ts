// This file is COMPLETELY AI generated
/*
TODO:
- Add indicators for what apps are focused or minimized (A little broken rn)
*/
import { Window } from '../windows/Window';
import { PackageManager } from '../../apis/packages/PackageManager';
import { AppLauncher } from './AppLauncher';

interface PinnedWindowEntry {
    id: string;
    title: string;
    icon?: string;
    url: string;
    order: number;
}

interface TaskBarEntry {
    itemId: string;
    instanceId: string | null;
    appId: string;
    title: string;
    icon?: string;
    url: string;
    isOpen: boolean;
    isPinned: boolean;
}

type TaskBarDisplayMode = 'iconOnly' | 'iconAndName';

export class TaskBar {
    private static readonly SETTINGS_KEY = 'taskbar';
    private static readonly PINNED_WINDOWS_KEY = 'pinned-windows';
    private static readonly DISPLAY_MODE_KEY = 'display-mode';
    private static readonly DEBUG: boolean = false;
    private static readonly DEBUG_BATTERY_LIFE: number = 55;

    private el: {
        taskbar: HTMLDivElement;
        windowList: HTMLDivElement;
        launcherBtn: HTMLDivElement;
        rightModules: HTMLDivElement;
        timeModule: HTMLDivElement;
        batteryModule?: HTMLDivElement;
    } = {} as any;
    private pinned: PinnedWindowEntry[] = [];
    private displayMode: TaskBarDisplayMode = 'iconOnly';
    private current: Map<string, Window> = new Map();
    private packageManager: PackageManager;
    private appLauncher: AppLauncher;
    private batteryManager: any = null;
    private timeInterval: number | null = null;

    constructor() {
        this.packageManager = new PackageManager();

        this.el.taskbar = document.createElement('div');
        this.el.windowList = document.createElement('div');
        this.el.launcherBtn = document.createElement('div');
        this.el.rightModules = document.createElement('div');
        this.el.timeModule = document.createElement('div');

        this.appLauncher = new AppLauncher(
            this.packageManager,
            this.el.launcherBtn,
            this.el.taskbar,
        );

        this.setupEls();
        this.loadState();
        this.attachListeners();
        this.registerContextMenus();
        this.initBattery();
        this.initTime();
    }

    public create(): void {
        document.body.appendChild(this.el.taskbar);
        this.appLauncher.create();
        this.render();
    }

    private setupEls(): void {
        this.el.taskbar.id = 'taskbar';
        this.el.taskbar.classList.add('taskbar');

        this.el.launcherBtn.id = 'launcher-button';
        this.el.launcherBtn.classList.add('taskbar-item', 'launcher-button');
        this.el.launcherBtn.draggable = false;

        this.el.launcherBtn.innerHTML = `
            <svg class="taskbar-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--mocha-subtext1);">
                <path d="M4 8V4H8V8H4Z" fill="currentColor"></path>
                <path d="M10 8V4H14V8H10Z" fill="currentColor"></path>
                <path d="M20 8V4H16V8H20Z" fill="currentColor"></path>
                <path d="M8 14V10H4V14H8Z" fill="currentColor"></path>
                <path d="M14 14V10H10V14H14Z" fill="currentColor"></path>
                <path d="M20 14V10H16V14H20Z" fill="currentColor"></path>
                <path d="M8 20V16H4V20H8Z" fill="currentColor"></path>
                <path d="M14 20V16H10V20H14Z" fill="currentColor"></path>
                <path d="M20 20V16H16V20H20Z" fill="currentColor"></path>
            </svg>
        `;
        this.el.launcherBtn.addEventListener('click', () => this.appLauncher.toggle());

        this.el.windowList.classList.add('taskbar-windows');

        this.el.rightModules.classList.add('taskbar-right-modules');
        this.setupTimeModule();
        this.setupBatteryModule();

        this.el.taskbar.appendChild(this.el.launcherBtn);
        this.el.taskbar.appendChild(this.el.windowList);
        this.el.taskbar.appendChild(this.el.rightModules);
    }
    private setupTimeModule(): void {
        this.el.timeModule.classList.add('taskbar-module', 'time-module');
        this.el.rightModules.appendChild(this.el.timeModule);
    }

    private setupBatteryModule(): void {
        if (this.shouldShowBattery()) {
            this.el.batteryModule = document.createElement('div');
            this.el.batteryModule.classList.add('taskbar-module', 'battery-module');
            this.el.rightModules.appendChild(this.el.batteryModule);
        }
    }

    private shouldShowBattery(): boolean {
        if (TaskBar.DEBUG) return true;
        return 'getBattery' in navigator && /Mobi|Android/i.test(navigator.userAgent);
    }

    private async initBattery(): Promise<void> {
        if (!this.shouldShowBattery() || !this.el.batteryModule) return;

        try {
            if (TaskBar.DEBUG) {
                this.updateBatteryDisplay(TaskBar.DEBUG_BATTERY_LIFE / 100, false);
                return;
            }

            this.batteryManager = await (navigator as any).getBattery();
            this.updateBatteryDisplay(this.batteryManager.level, this.batteryManager.charging);

            this.batteryManager.addEventListener('levelchange', () => {
                this.updateBatteryDisplay(this.batteryManager.level, this.batteryManager.charging);
            });

            this.batteryManager.addEventListener('chargingchange', () => {
                this.updateBatteryDisplay(this.batteryManager.level, this.batteryManager.charging);
            });
        } catch (err) {
            if (this.el.batteryModule) {
                this.el.batteryModule.style.display = 'none';
            }
        }
    }

    private updateBatteryDisplay(level: number, charging: boolean): void {
        if (!this.el.batteryModule) return;

        const percent = Math.round(level * 100);
        let color = '#f38ba8';

        if (percent > 70) color = '#a6e3a1';
        else if (percent > 20) color = '#f9e2af';

        const fillHeight = Math.max(1, (percent / 100) * 14);
        const fillY = 4 + (14 - fillHeight);

        this.el.batteryModule.innerHTML = `
        <div class="battery-container">
            <svg class="battery-icon" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="2" width="12" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="9" y="0" width="6" height="2" rx="1" fill="currentColor"/>
                <rect x="8" y="${fillY}" width="8" height="${fillHeight}" rx="1" fill="${color}"/>
                ${charging ? '<path d="M10 12l-2 4h4l-2-4z" fill="currentColor"/>' : ''}
            </svg>
        </div>
    `;
    }

    private initTime(): void {
        this.updateTime();
        this.timeInterval = window.setInterval(() => this.updateTime(), 1000);
    }

    private updateTime(): void {
        const now = new Date();
        const time = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const date = now.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

        this.el.timeModule.innerHTML = `
        <div class="time-container">
            <div class="time-text">${time}</div>
            <div class="date-text">${date}</div>
        </div>
    `;
    }

    private attachListeners(): void {
        this.el.windowList.addEventListener('dragstart', this.handleDragStart);
        this.el.windowList.addEventListener('dragover', this.handleDragOver);
        this.el.windowList.addEventListener('drop', this.handleDrop);
        this.el.windowList.addEventListener('dragend', this.handleDragEnd);
        this.el.windowList.addEventListener('dragenter', this.handleDragEnter);
        this.el.windowList.addEventListener('dragleave', this.handleDragLeave);
    }

    public render(): void {
        const entries: TaskBarEntry[] = [];
        const processed = new Set<string>();
        const current = new Map<string, Window>();
        const items = new Map<string, HTMLDivElement>();

        this.el.windowList.querySelectorAll('.taskbar-item').forEach(item => {
            const id = (item as HTMLDivElement).dataset.id;

            if (id) {
                items.set(id, item as HTMLDivElement);
            }
        });

        window.xen.wm.windows.forEach((win) => {
            current.set(win.id, win);

            if (win.props.display) {
                const isPinned = this.pinned.some((p) => p.id === win.props.url);

                entries.push({
                    itemId: win.id,
                    instanceId: win.id,
                    appId: win.props.url,
                    title: win.props.title,
                    icon: win.props.icon,
                    url: win.props.url,
                    isOpen: true,
                    isPinned: isPinned,
                });

                processed.add(win.props.url);
            }
        });

        this.current = current;

        this.pinned.forEach((pinnedEntry) => {
            if (!processed.has(pinnedEntry.id)) {
                entries.push({
                    itemId: pinnedEntry.id,
                    instanceId: null,
                    appId: pinnedEntry.id,
                    title: pinnedEntry.title,
                    icon: pinnedEntry.icon,
                    url: pinnedEntry.url,
                    isOpen: false,
                    isPinned: true,
                });

                processed.add(pinnedEntry.id);
            }
        });

        const sorted = entries.sort((a, b) => {
            const aPinned = this.pinned.find((p) => p.id === a.appId);
            const bPinned = this.pinned.find((p) => p.id === b.appId);

            if (aPinned && bPinned) return aPinned.order - bPinned.order;
            if (aPinned) return -1;
            if (bPinned) return 1;
            if (a.isOpen && !b.isOpen) return -1;
            if (!a.isOpen && b.isOpen) return 1;

            return a.title.localeCompare(b.title);
        });

        const newItems = new Set(sorted.map(entry => entry.itemId));

        items.forEach((item, id) => {
            if (!newItems.has(id)) {
                this.animateItemOut(item);
            }
        });

        const animOut = this.el.windowList.querySelectorAll('.taskbar-item.animate-out');

        this.el.windowList.innerHTML = '';

        animOut.forEach(item => {
            this.el.windowList.appendChild(item);
        });

        sorted.forEach((entry) => {
            const existing = items.has(entry.itemId);
            const item = this.createItem(entry, !existing);

            this.el.windowList.appendChild(item);
            this.createContextMenu(entry, item);

            if (!existing) {
                this.animateItemIn(item);
            }
        });
    }

    private createItem(entry: {
        itemId: string;
        instanceId: string | null;
        appId: string;
        title: string;
        icon?: string;
        url: string;
        isOpen: boolean;
        isPinned: boolean;
    }, isNew: boolean = false): HTMLDivElement {
        const item = document.createElement('div');
        item.classList.add('taskbar-item');
        item.dataset.id = entry.itemId;
        item.draggable = true;

        if (isNew) {
            item.classList.add('animate-in');
            item.style.transform = 'scale(0)';
            item.style.opacity = '0';
        }

        const icon = document.createElement('img');

        icon.classList.add('taskbar-item-icon');
        icon.src = entry.icon || './assets/app.png';
        icon.alt = `${entry.title} icon`;
        icon.draggable = false;

        item.appendChild(icon);

        if (this.displayMode === 'iconAndName') {
            const name = document.createElement('span');

            name.classList.add('taskbar-item-name');
            name.textContent = entry.title;
            item.appendChild(name);
        }

        if (entry.isOpen) {
            item.classList.add('is-open');
            const indicator = document.createElement('div');

            indicator.classList.add('taskbar-item-indicator');
            item.appendChild(indicator);
        }

        if (entry.isPinned) item.classList.add('is-pinned');

        item.addEventListener('click', (e) => {
            if (!item.classList.contains('dragging')) {
                this.handleClick(
                    entry.instanceId,
                    entry.appId,
                    entry.title,
                    entry.icon,
                );
            }
        });

        return item;
    }

    private animateItemIn(item: HTMLDivElement): void {
        item.offsetHeight;

        requestAnimationFrame(() => {
            item.style.transform = 'scale(1)';
            item.style.opacity = '1';

            setTimeout(() => {
                item.classList.remove('animate-in');
                item.style.transform = '';
                item.style.opacity = '';
            }, 300);
        });
    }

    private animateItemOut(item: HTMLDivElement): void {
        item.classList.add('animate-out');

        requestAnimationFrame(() => {
            item.style.transform = 'scale(0) rotate(180deg)';
            item.style.opacity = '0';

            setTimeout(() => {
                if (item.parentNode) {
                    item.parentNode.removeChild(item);
                }
            }, 300);
        });
    }

    private handleClick(
        instanceId: string | null,
        appId: string,
        title: string,
        icon?: string,
    ): void {
        let instance = instanceId ? this.current.get(instanceId) : undefined;

        if (!instance) {
            for (const win of window.xen.wm.windows) {
                if (win.props.url === appId) {
                    instance = win;
                    break;
                }
            }
        }

        if (instance) {
            instance.focus();
            if (instance.isMinimized) instance.minimize();
        } else {
            window.xen.wm.create({ url: appId, title, icon });
        }
    }

    public onWindowCreated = (): void => {
        setTimeout(() => {
            this.render();
        }, 50);
    };

    public onWindowClosed = (): void => {
        setTimeout(() => {
            this.render();
        }, 100);
    };

    public onWindowFocused = (windowInstance: Window): void => {
        this.el.windowList
            .querySelectorAll('.taskbar-item')
            .forEach((item) => item.classList.remove('is-focused'));

        const item = this.el.windowList.querySelector(`[data-id="${windowInstance.id}"]`);
        if (item && windowInstance.props.display) item.classList.add('is-focused');
    };

    private registerContextMenus(): void {
        window.xen.ui.contextMenu.attach(this.el.taskbar, {
            root: [
                {
                    title: 'Toggle Window Names',
                    toggle: this.displayMode === 'iconAndName',
                    onClick: () => this.toggleDM()
                }
            ]
        });
    }

    private createContextMenu(entry: {
        itemId: string;
        instanceId: string | null;
        appId: string;
        title: string;
        icon?: string;
        url: string;
        isOpen: boolean;
        isPinned: boolean;
    }, item: HTMLDivElement): void {
        const menuOptions: any = {
            root: [
                {
                    title: entry.isPinned ? 'Unpin from Dock' : 'Pin to Dock',
                    toggle: entry.isPinned,
                    onClick: () => this.togglePin(entry.appId, entry.title, entry.icon, entry.url)
                }
            ]
        };

        if (entry.isOpen && entry.instanceId) {
            menuOptions.root.push({
                title: 'Close Window',
                onClick: () => this.closeWindow(entry.instanceId!)
            });
        }

        window.xen.ui.contextMenu.attach(item, menuOptions);
    }

    private toggleDM(): void {
        this.displayMode = this.displayMode === 'iconOnly' ? 'iconAndName' : 'iconOnly';

        window.xen.settings.set(TaskBar.SETTINGS_KEY, {
            [TaskBar.DISPLAY_MODE_KEY]: this.displayMode,
        });

        window.xen.ui.contextMenu.attach(this.el.taskbar, {
            root: [
                {
                    title: 'Toggle Window Names',
                    toggle: this.displayMode === 'iconAndName',
                    onClick: () => this.toggleDM()
                }
            ]
        });

        this.render();
    }

    public togglePin(
        id: string,
        title: string,
        icon?: string,
        url?: string,
    ): void {
        const index = this.pinned.findIndex((p) => p.id === id);

        if (index !== -1) {
            this.pinned.splice(index, 1);
        } else {
            if (url === undefined || title === undefined) return;

            this.pinned.push({
                id: id,
                title: title,
                icon: icon,
                url: url,
                order: this.pinned.length,
            });
        }

        this.savePinned();
        this.render();
    }

    public closeWindow(id: string): void {
        const win = window.xen.wm.windows.find((win) => win.id === id);

        if (win) {
            const item = this.el.windowList.querySelector(`[data-id="${id}"]`) as HTMLDivElement;
            if (item) {
                this.animateItemOut(item);

                setTimeout(() => {
                    win.close();
                }, 150);
            } else {
                win.close();
            }
        } else {
            this.current.delete(id);
            this.render();
        }
    }

    private savePinned(): void {
        try {
            const taskbarSettings =
                window.xen.settings.get(TaskBar.SETTINGS_KEY) || {};
            taskbarSettings[TaskBar.PINNED_WINDOWS_KEY] = this.pinned;
            window.xen.settings.set(TaskBar.SETTINGS_KEY, taskbarSettings);
        } catch (err) {
            console.error('Failed to save pinned windows:', err);
        }
    }

    private loadState(): void {
        try {
            const taskbarSettings = window.xen.settings.get(TaskBar.SETTINGS_KEY) || {};
            const storedPinned = taskbarSettings[TaskBar.PINNED_WINDOWS_KEY] || [];

            if (storedPinned) {
                this.pinned = storedPinned;
                this.pinned.forEach(
                    (p, i) => (p.order = p.order === undefined ? i : p.order),
                );
                this.pinned.sort((a, b) => a.order - b.order);
            }

            const storedDM = taskbarSettings[TaskBar.DISPLAY_MODE_KEY];
            if (storedDM) this.displayMode = storedDM as TaskBarDisplayMode;
        } catch (err) {
            console.error('Failed to load taskbar:', err);

            this.pinned = [];
            this.displayMode = 'iconOnly';
        }
    }

    private draggedItem: HTMLDivElement | null = null;
    private dragPlaceholder: HTMLDivElement | null = null;
    private lastDragOverTime: number = 0;
    private dragOverThrottle: number = 50;

    private createDragPlaceholder(): HTMLDivElement {
        const placeholder = document.createElement('div');

        placeholder.classList.add('taskbar-item', 'drag-placeholder');
        placeholder.style.width = '40px';
        placeholder.style.height = '40px';

        return placeholder;
    }

    private handleDragStart = (e: DragEvent): void => {
        const target = (e.target as HTMLElement).closest('.taskbar-item') as HTMLDivElement;

        if (!target || target.classList.contains('launcher-button')) {
            e.preventDefault();
            return;
        }

        this.draggedItem = target;
        this.dragPlaceholder = this.createDragPlaceholder();

        setTimeout(() => {
            target.classList.add('dragging');
        }, 0);

        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', target.dataset.id ?? '');
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    private handleDragEnter = (e: DragEvent): void => {
        e.preventDefault();
    };

    private handleDragLeave = (e: DragEvent): void => {
        if (!this.el.windowList.contains(e.relatedTarget as Node)) {
            this.clearDragEffects();
        }
    };

    private handleDragOver = (e: DragEvent): void => {
        e.preventDefault();

        const now = Date.now();
        if (now - this.lastDragOverTime < this.dragOverThrottle) {
            return;
        }

        this.lastDragOverTime = now;

        if (!this.draggedItem || !this.dragPlaceholder) return;

        const target = (e.target as HTMLElement).closest('.taskbar-item') as HTMLDivElement;

        if (target && target !== this.draggedItem && !target.classList.contains('launcher-button') && !target.classList.contains('drag-placeholder')) {
            const targetRect = target.getBoundingClientRect();
            const mouseX = e.clientX;
            const deadzone = targetRect.width * 0.3;
            const leftThreshold = targetRect.left + deadzone;
            const rightThreshold = targetRect.right - deadzone;
            let insertBefore: Element | null = null;

            if (mouseX < leftThreshold) {
                insertBefore = target;
            } else if (mouseX > rightThreshold) {
                insertBefore = target.nextElementSibling;
            } else {
                return;
            }

            const next = this.dragPlaceholder.nextElementSibling;

            if (insertBefore !== next) {
                if (this.dragPlaceholder.parentNode) {
                    this.dragPlaceholder.parentNode.removeChild(this.dragPlaceholder);
                }

                this.clearDrops();
                target.classList.add('drag-over');
                this.el.windowList.insertBefore(this.dragPlaceholder, insertBefore);
            }
        }
    };

    private handleDrop = (e: DragEvent): void => {
        e.preventDefault();

        if (this.draggedItem && this.dragPlaceholder) {
            this.el.windowList.insertBefore(this.draggedItem, this.dragPlaceholder);
            this.reorder();
            this.savePinned();
        }

        this.clearDragEffects();
    };

    private handleDragEnd = (): void => {
        this.clearDragEffects();

        setTimeout(() => {
            this.render();
        }, 100);
    };

    private clearDragEffects(): void {
        if (this.dragPlaceholder && this.dragPlaceholder.parentNode) {
            this.dragPlaceholder.parentNode.removeChild(this.dragPlaceholder);
        }

        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }

        this.clearDrops();

        this.draggedItem = null;
        this.dragPlaceholder = null;
    }

    private clearDrops(): void {
        this.el.windowList.querySelectorAll('.drag-over').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    private reorder(): void {
        const order: PinnedWindowEntry[] = [];
        const items = Array.from(this.el.windowList.children) as HTMLDivElement[];

        items.forEach((itemEl, index) => {
            if (itemEl.classList.contains('drag-placeholder')) return;

            const itemId = itemEl.dataset.id;
            if (!itemId) return;

            const instance = window.xen.wm.windows.find((win) => win.id === itemId);

            if (instance) {
                const appId = instance.props.url;
                const entry = this.pinned.find((p) => p.id === appId);

                if (entry) {
                    entry.order = index;
                    order.push(entry);
                }
            } else {
                const entry = this.pinned.find((p) => p.id === itemId);

                if (entry) {
                    entry.order = index;
                    order.push(entry);
                }
            }
        });

        this.pinned = this.pinned.map(p => {
            const updated = order.find(o => o.id === p.id);
            return updated || p;
        }).sort((a, b) => a.order - b.order);
    }

    public getHeight(): number {
        const rect = this.el.taskbar.getBoundingClientRect();
        return window.innerHeight - rect.top + 10;
    }

    public destroy(): void {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
}