/*
TODO:
- Fix spacing and alignment for app entries
- Allow for toggling modules to the right (Time, date, battery)
- Fix dragging
- Add inedcators for what apps are focused or minimized (A little broken rn)
- Fix icon paths
*/
import { WindowManager } from './windows/WindowManager';
import { Window } from './windows/Window';
import { ContextMenu } from './ContextMenu';
import {
    PinnedWindowEntry,
    TaskBarDisplayMode,
    TaskBarEntry,
} from '../types/UI';
import { AppManager } from '../apis/process/Apps';
import { AppLauncher } from './AppLauncher';

export class TaskBar {
    private static readonly LOCAL_STORAGE = {
        PINNED_WINDOWS: 'XEN-TASKBAR-PINNED_WINDOWS',
        DISPLAY_MODE: 'XEN-TASKBAR-DISPLAY_MODE',
    };
    //@ts-ignore
    private el: {
        taskbar: HTMLDivElement;
        windowList: HTMLDivElement;
        launcherBtn: HTMLDivElement;
    } = {};
    private pinned: PinnedWindowEntry[] = [];
    private displayMode: TaskBarDisplayMode = 'iconOnly';
    private current: Map<string, Window> = new Map();
    private appManager: AppManager;
    private appLauncher: AppLauncher;

    constructor(private wm: WindowManager, private contextMenu: ContextMenu) {
        this.appManager = new AppManager();

        this.el.taskbar = document.createElement('div');
        this.el.windowList = document.createElement('div');
        this.el.launcherBtn = document.createElement('div');

        this.appLauncher = new AppLauncher(
            this.appManager,
            this.el.launcherBtn,
            this.el.taskbar,
        );

        this.setupEls();
        this.loadState();
        this.attachListeners();
        this.registerContextMenus();
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
        // Shoutout Gemini 2.5 (also needs a real icon!!)
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
        this.el.taskbar.appendChild(this.el.launcherBtn);
        this.el.windowList.classList.add('taskbar-windows');
        this.el.taskbar.appendChild(this.el.windowList);
        this.contextMenu.attach(this.el.taskbar, 'XEN-TASKBAR');
    }

    private attachListeners(): void {
        this.el.windowList.addEventListener('dragstart', this.handleDragStart);
        this.el.windowList.addEventListener('dragover', this.handleDragOver);
        this.el.windowList.addEventListener('drop', this.handleDrop);
        this.el.windowList.addEventListener('dragend', this.handleDragEnd);
    }

    public render(): void {
        this.el.windowList.innerHTML = '';
        const entries: TaskBarEntry[] = [];
        const processed = new Set<string>();
        const current = new Map<string, Window>();

        this.wm.windows.forEach((win) => {
            current.set(win.id, win);
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

        sorted.forEach((entry) => {
            const item = this.createItem(entry);

            this.el.windowList.appendChild(item);
            this.createContextMenu(entry);
            this.contextMenu.attach(item, `XEN-TASKBAR-ITEM_${entry.itemId}`);
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
    }): HTMLDivElement {
        const item = document.createElement('div');
        item.classList.add('taskbar-item');
        item.dataset.id = entry.itemId;
        item.draggable = true;

        const icon = document.createElement('img');
        icon.classList.add('taskbar-item-icon');
        icon.src = entry.icon || './assets/app.png';
        icon.alt = `${entry.title} icon`;

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

        item.addEventListener('click', () => {
            this.handleClick(
                entry.instanceId,
                entry.appId,
                entry.title,
                entry.icon,
            );
        });

        return item;
    }

    private handleClick(
        instanceId: string | null,
        appId: string,
        title: string,
        icon?: string,
    ): void {
        let instance = instanceId ? this.current.get(instanceId) : undefined;

        if (!instance) {
            for (const win of this.wm.windows) {
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
            this.wm.create({ url: appId, title, icon });
        }
    }

    public onWindowCreated = (): void => this.render();
    public onWindowClosed = (): void => this.render();
    public onWindowFocused = (windowInstance: Window): void => {
        this.el.windowList
            .querySelectorAll('.taskbar-item')
            .forEach((item) => item.classList.remove('is-focused'));

        const item = this.el.windowList.querySelector(`[data-id="${windowInstance.id}"]`);
        if (item) item.classList.add('is-focused');
    };

    private registerContextMenus(): void {
        this.contextMenu.registerFunction('toggleTBDM', () => this.toggleDM());

        this.contextMenu.create(
            {
                id: 'toggleTBDM',
                domain: 'XEN-TASKBAR',
                title: 'Toggle Window Names',
            },
            this.contextMenu.registry['toggleTBDM'],
        );
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
    }): void {
        const domain = `XEN-TASKBAR-ITEM_${entry.itemId}`;

        this.contextMenu.registerFunction('togglePin',
            (appId: string, title: string, icon?: string, url?: string) =>
                this.togglePin(appId, title, icon, url));

        this.contextMenu.registerFunction('closeWindow', (id: string) => this.closeWindow(id));

        this.contextMenu.create({
            id: `XEN-TASKBAR-PIN_${entry.appId}`,
            domain: domain,
            title: entry.isPinned ? 'Unpin from Dock' : 'Pin to Dock',
            funcId: 'togglePin',
            funcArgs: [entry.appId, entry.title, entry.icon, entry.url],
        });

        if (entry.isOpen && entry.instanceId) {
            this.contextMenu.create({
                id: `XEN-TASKBAR-CLOSE_${entry.instanceId}`,
                domain: domain,
                title: 'Close Window',
                funcId: 'closeWindow',
                funcArgs: [entry.instanceId],
            });
        } else {
            if (entry.instanceId) this.contextMenu.delete(`XEN-TASKBAR-CLOSE_${entry.instanceId}`);
        }
    }

    private toggleDM(): void {
        this.displayMode = this.displayMode === 'iconOnly' ? 'iconAndName' : 'iconOnly';

        localStorage.setItem(
            TaskBar.LOCAL_STORAGE.DISPLAY_MODE,
            this.displayMode,
        );

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
        const win = this.wm.windows.find((win) => win.id === id);

        if (win) {
            win.close();
        } else {
            this.current.delete(id);
            this.render();
        }
    }

    private savePinned(): void {
        try {
            localStorage.setItem(
                TaskBar.LOCAL_STORAGE.PINNED_WINDOWS,
                JSON.stringify(this.pinned),
            );
        } catch (err) {
            console.error('Failed to save pinned windows:', err);
        }
    }

    private loadState(): void {
        try {
            const stored = localStorage.getItem(
                TaskBar.LOCAL_STORAGE.PINNED_WINDOWS,
            );

            if (stored) {
                this.pinned = JSON.parse(stored);
                this.pinned.forEach(
                    (p, i) => (p.order = p.order === undefined ? i : p.order),
                );
                this.pinned.sort((a, b) => a.order - b.order);
            }

            const DM = localStorage.getItem(TaskBar.LOCAL_STORAGE.DISPLAY_MODE);
            if (DM) this.displayMode = DM as TaskBarDisplayMode;
        } catch (err) {
            console.error('Failed to load taskbar:', err);

            this.pinned = [];
            this.displayMode = 'iconOnly';
        }
    }

    private draggedItem: HTMLDivElement | null = null;

    private handleDragStart = (e: DragEvent): void => {
        const target = e.target as HTMLDivElement;

        if (!target.classList.contains('taskbar-item')) {
            e.preventDefault();
            return;
        }

        this.draggedItem = target;

        if (e.dataTransfer) {
            e.dataTransfer.setData(
                'text/plain',
                this.draggedItem.dataset.id ?? '',
            );
            e.dataTransfer.effectAllowed = 'move';
        }

        setTimeout(() => {
            this.draggedItem?.classList.add('dragging');
        }, 0);
    };

    private handleDragOver = (e: DragEvent): void => {
        e.preventDefault();

        if (this.draggedItem && e.target instanceof HTMLDivElement) {
            const target = e.target.closest('.taskbar-item') as HTMLDivElement | null;

            if (target && target !== this.draggedItem) {
                const targetRect = target.getBoundingClientRect();
                const mouseX = e.clientX;
                const middle = targetRect.left + targetRect.width / 2;

                if (mouseX < middle) {
                    this.el.windowList.insertBefore(this.draggedItem, target);
                } else {
                    this.el.windowList.insertBefore(
                        this.draggedItem,
                        target.nextSibling,
                    );
                }
            }
        }
    };

    private handleDrop = (e: DragEvent): void => {
        e.preventDefault();

        if (this.draggedItem) {
            this.reoder();
            this.savePinned();
        }
    };

    private handleDragEnd = (): void => {
        this.draggedItem?.classList.remove('dragging');
        this.draggedItem = null;
        this.render();
    };

    private reoder(): void {
        const order: PinnedWindowEntry[] = [];
        const items = Array.from(
            this.el.windowList.children,
        ) as HTMLDivElement[];

        items.forEach((itemEl, index) => {
            const itemId = (itemEl as HTMLElement).dataset.id;

            if (itemId) {
                const instance = this.wm.windows.find((win) => win.id === itemId);

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
            }
        });

        const unique = new Set(order.map((p) => p.id));

        this.pinned = this.pinned
            .filter((p) => unique.has(p.id))
            .concat(order.filter((p) => !this.pinned.some((orig) => orig.id === p.id)))
            .sort((a, b) => a.order - b.order);
    }
}