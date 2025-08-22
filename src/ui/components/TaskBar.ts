import { Window } from './Window';
import { AppLauncher } from './AppLauncher';
import { Calendar } from './Calendar';
import { Systray } from '../apis/Systray';

interface TaskBarEntry {
    itemId: string;
    instanceId: string | null;
    appId: string;
    title: string;
    icon?: string;
    url: string;
    isOpen: boolean;
}

interface PinnedTaskBarEntry extends TaskBarEntry {
    appId: string;
    isPinned: true;
}

export class TaskBar {
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
    private current: Map<string, Window> = new Map();
    public appLauncher: AppLauncher;
    private batteryManager: any = null;
    private timeInterval: number | null = null;
    private calendar: Calendar;
    private systray: Systray;
    private showAppNames: boolean = false;
    private pinned: PinnedTaskBarEntry[] = [];

    constructor() {
        this.el.taskbar = document.createElement('div');
        this.el.windowList = document.createElement('div');
        this.el.launcherBtn = document.createElement('div');
        this.el.rightModules = document.createElement('div');
        this.el.timeModule = document.createElement('div');

        this.appLauncher = new AppLauncher(
            this.el.launcherBtn,
            this.el.taskbar,
        );

        this.calendar = new Calendar();
    }

    public init() {
        this.systray = window.xen.systray;
        this.setupEls();
        this.initBattery();
        this.initTime();
        this.attachListeners();
        this.contextMenu();
    }

    public async loadPinnedEntries(): Promise<void> {
        const saved = window.xen.settings.get('pinned-taskbar-entries');
        if (saved) {
            this.pinned = [];
            for (const entry of saved) {
                try {
                    const manifest = await window.xen.packages.getManifest(entry.appId);
                    const iconPath = location.origin + '/fs/usr/apps/' + entry.appId + '/' + manifest.icon;

                    this.pinned.push({
                        ...entry,
                        icon: iconPath,
                        isPinned: true,
                        isOpen: false,
                        instanceId: null,
                    });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    private savePinned(): void {
        const toSave = this.pinned.map(entry => ({
            itemId: entry.itemId,
            appId: entry.appId,
            title: entry.title,
            url: entry.url,
        }));
        window.xen.settings.set('pinned-taskbar-entries', toSave);
    }

    private getAppId(url: string): string {
        const match = url.match(/\/apps\/([^\/]+)\//);
        return match ? match[1] : url;
    }

    private async pin(entry: TaskBarEntry): Promise<void> {
        const appId = this.getAppId(entry.url);

        if (this.pinned.some(p => p.appId === appId)) return;

        try {
            const manifest = await window.xen.packages.getManifest(appId);
            const iconPath = location.origin + '/fs/usr/apps/' + appId + '/' + manifest.icon;

            const pinnedEntry: PinnedTaskBarEntry = {
                itemId: `pinned-${appId}`,
                instanceId: null,
                appId,
                title: entry.title,
                icon: iconPath,
                url: entry.url,
                isOpen: false,
                isPinned: true,
            };

            this.pinned.push(pinnedEntry);
            this.savePinned();
            this.render();
        } catch (e) {
            console.error('Failed to pin entry:', e);
        }
    }

    private unpin(appId: string): void {
        this.pinned = this.pinned.filter(p => p.appId !== appId);
        this.savePinned();
        this.render();
    }

    private isPinned(appId: string): boolean {
        return this.pinned.some(p => p.appId === appId);
    }

    public create(): void {
        document.body.appendChild(this.el.taskbar);
        this.appLauncher.create();
        this.calendar.create();
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

        this.el.launcherBtn.addEventListener('click', () =>
            this.appLauncher.toggle(),
        );
        this.el.windowList.classList.add('taskbar-windows');
        this.el.rightModules.classList.add('taskbar-right-modules');

        const systrayContainer = this.systray.getContainer();
        if (systrayContainer) {
            this.el.rightModules.appendChild(systrayContainer);
        }

        this.setupTimeModule();
        this.setupBatteryModule();

        this.el.taskbar.appendChild(this.el.launcherBtn);
        this.el.taskbar.appendChild(this.el.windowList);
        this.el.taskbar.appendChild(this.el.rightModules);
    }

    private contextMenu(): void {
        window.xen.contextMenu.attach(this.el.taskbar, {
            root: [
                {
                    title: 'Show App Names',
                    toggle: this.showAppNames,
                    onClick: () => {
                        this.toggleNames();
                        this.contextMenu();
                    },
                },
            ],
        });
    }

    private toggleNames(): void {
        this.showAppNames = !this.showAppNames;
        this.el.taskbar.classList.toggle('show-app-names', this.showAppNames);
        this.render();
    }

    private setupTimeModule(): void {
        this.el.timeModule.classList.add('taskbar-module', 'time-module');
        this.el.timeModule.addEventListener('click', () => this.toggleCalendar());
        this.el.rightModules.appendChild(this.el.timeModule);
    }

    private toggleCalendar(): void {
        this.calendar.toggle(this.el.timeModule);
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
            this.updateBatteryDisplay(
                this.batteryManager.level,
                this.batteryManager.charging,
            );

            this.batteryManager.addEventListener('levelchange', () => {
                this.updateBatteryDisplay(
                    this.batteryManager.level,
                    this.batteryManager.charging,
                );
            });

            this.batteryManager.addEventListener('chargingchange', () => {
                this.updateBatteryDisplay(
                    this.batteryManager.level,
                    this.batteryManager.charging,
                );
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
            hour12: true,
        });
        const date = now.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });

        this.el.timeModule.innerHTML = `
        <div class="time-container">
            <div class="time-text">${time}</div>
            <div class="date-text">${date}</div>
        </div>
    `;
    }

    private async attachListeners() {
        this.el.windowList.addEventListener('dragstart', this.handleDragStart);
        this.el.windowList.addEventListener('dragover', this.handleDragOver);
        await this.el.windowList.addEventListener('drop', this.handleDrop);
        this.el.windowList.addEventListener('dragend', this.handleDragEnd);
        this.el.windowList.addEventListener('dragenter', this.handleDragEnter);
        this.el.windowList.addEventListener('dragleave', this.handleDragLeave);
    }

    public render(): void {
        const entries: (TaskBarEntry | PinnedTaskBarEntry)[] = [];
        const processed = new Set<string>();
        const current = new Map<string, Window>();
        const items = new Map<string, HTMLDivElement>();

        this.el.windowList.querySelectorAll('.taskbar-item').forEach((item) => {
            const id = (item as HTMLDivElement).dataset.id;
            if (id) {
                items.set(id, item as HTMLDivElement);
            }
        });

        this.pinned.forEach(pinnedEntry => {
            const openWindow = Array.from(window.xen.wm.windows).find(win =>
                this.getAppId(win.props.url) === pinnedEntry.appId && win.props.display
            );

            if (openWindow) {
                entries.push({
                    itemId: openWindow.id,
                    instanceId: openWindow.id,
                    appId: this.getAppId(openWindow.props.url),
                    title: openWindow.props.title,
                    icon: openWindow.props.icon,
                    url: openWindow.props.url,
                    isOpen: true,
                });
                processed.add(this.getAppId(openWindow.props.url));
                current.set(openWindow.id, openWindow);
            } else {
                entries.push({
                    ...pinnedEntry,
                    isOpen: false,
                });
                processed.add(pinnedEntry.appId);
            }
        });

        window.xen.wm.windows.forEach((win) => {
            if (win.props.display) {
                const appId = this.getAppId(win.props.url);
                if (!processed.has(appId)) {
                    entries.push({
                        itemId: win.id,
                        instanceId: win.id,
                        appId: win.props.url,
                        title: win.props.title,
                        icon: win.props.icon,
                        url: win.props.url,
                        isOpen: true,
                    });
                    current.set(win.id, win);
                }
            }
        });

        this.current = current;

        const newItems = new Set(entries.map((entry) => entry.itemId));

        items.forEach((item, id) => {
            if (!newItems.has(id)) {
                this.animateItemOut(item);
            }
        });

        const animOut = this.el.windowList.querySelectorAll(
            '.taskbar-item.animate-out',
        );

        this.el.windowList.innerHTML = '';

        animOut.forEach((item) => {
            this.el.windowList.appendChild(item);
        });

        entries.forEach((entry) => {
            const existing = items.has(entry.itemId);
            const item = this.createItem(entry, !existing);
            this.el.windowList.appendChild(item);

            if (!existing) {
                this.animateItemIn(item);
            }
        });
    }

    private createItem(
        entry: TaskBarEntry | PinnedTaskBarEntry,
        isNew: boolean = false,
    ): HTMLDivElement {
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

        if (this.showAppNames) {
            const appName = document.createElement('span');
            appName.classList.add('taskbar-item-name');
            appName.textContent = entry.title;
            item.appendChild(appName);
            item.classList.add('show-name');
        } else {
            item.classList.remove('show-name');
        }

        if (entry.isOpen) {
            item.classList.add('is-open');
            const indicator = document.createElement('div');
            indicator.classList.add('taskbar-item-indicator');
            item.appendChild(indicator);
        }

        item.addEventListener('click', (e) => {
            if (!item.classList.contains('dragging')) {
                this.handleClick(entry.instanceId, entry.appId, entry.title, entry.icon);
            }
        });

        this.setupItemContextMenu(item, entry);

        return item;
    }

    private setupItemContextMenu(item: HTMLElement, entry: TaskBarEntry | PinnedTaskBarEntry): void {
        const appId = this.getAppId(entry.url);
        const pinned = this.isPinned(appId);

        const menuItems = [];

        if (pinned && !entry.isOpen) {
            menuItems.push({
                title: 'Open',
                onClick: async () => {
                    await window.xen.packages.open(appId);
                },
            });
        }

        if (entry.isOpen) {
            menuItems.push({
                title: 'Close',
                onClick: () => this.closeWindow(entry.itemId),
            });
        }

        menuItems.push({
            title: pinned ? 'Unpin' : 'Pin',
            onClick: () => {
                if (pinned) {
                    this.unpin(appId);
                } else {
                    this.pin(entry as TaskBarEntry);
                }
            },
        });

        window.xen.contextMenu.attach(item, {
            root: menuItems,
        });
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

    private async handleClick(
        instanceId: string | null,
        appId: string,
        title: string,
        icon?: string,
    ): Promise<void> {
        let instance = instanceId ? this.current.get(instanceId) : undefined;

        if (!instance) {
            for (const win of window.xen.wm.windows) {
                if (this.getAppId(win.props.url) === this.getAppId(appId)) {
                    instance = win;
                    break;
                }
            }
        }

        if (instance) {
            if (instance.isFocused && !instance.isMinimized) {
                instance.minimize();
            } else {
                instance.focus();

                if (instance.isMinimized) {
                    instance.minimize();
                }
            }
        } else {
            const realAppId = this.getAppId(appId);

            if (this.isPinned(realAppId)) {
                await window.xen.packages.open(realAppId);
            } else {
                window.xen.wm.create({ url: appId, title, icon });
            }
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

    public closeWindow(id: string): void {
        const win = window.xen.wm.windows.find((win) => win.id === id);

        if (win) {
            const item = this.el.windowList.querySelector(
                `[data-id="${id}"]`,
            ) as HTMLDivElement;

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
        const target = (e.target as HTMLElement).closest(
            '.taskbar-item',
        ) as HTMLDivElement;

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

        const target = (e.target as HTMLElement).closest(
            '.taskbar-item',
        ) as HTMLDivElement;

        if (
            target &&
            target !== this.draggedItem &&
            !target.classList.contains('launcher-button') &&
            !target.classList.contains('drag-placeholder')
        ) {
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

    private handleDrop = async (e: DragEvent) => {
        e.preventDefault();

        if (this.draggedItem && this.dragPlaceholder) {
            this.el.windowList.insertBefore(this.draggedItem, this.dragPlaceholder);
            this.reorder();
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
        this.el.windowList.querySelectorAll('.drag-over').forEach((item) => {
            item.classList.remove('drag-over');
        });
    }

    private reorder(): void {
        const items = Array.from(this.el.windowList.children) as HTMLDivElement[];

        items.forEach((itemEl, index) => {
            if (itemEl.classList.contains('drag-placeholder')) return;

            const itemId = itemEl.dataset.id;
            if (!itemId) return;
        });
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

        this.systray.destroy();
    }
}