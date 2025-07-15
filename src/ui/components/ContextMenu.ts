// TODO: Translucent
import { ContextMenuEntry, FunctionRegistry } from '../../types/UI';
import { settings } from '../../apis/settings';

export class ContextMenu {
    private static readonly STORAGE_KEY = 'context-menu';
    private entries: ContextMenuEntry[] = [];
    public registry: FunctionRegistry = {};
    private menuEl: HTMLDivElement | null = null;

    constructor() {
        this.loadEntries();
        document.addEventListener('click', this.handleClick);
    }

    public registerFunction(funcId: string, func: (...args: any[]) => void): void {
        this.registry[funcId] = func;
    }

    public unregisterFunction(funcId: string): void {
        delete this.registry[funcId];
    }

    public create(
        entryOpts: Omit<ContextMenuEntry, 'funcId' | 'funcArgs'> & { funcId?: string; funcArgs?: any[] },
        func?: (...args: any[]) => void,
    ): void {
        const id = entryOpts.funcId || entryOpts.id;
        const index = this.entries.findIndex((e) => e.id === entryOpts.id);
        if (index !== -1) {this.entries.splice(index, 1);}

        if (func && this.registry[id] !== func) {
            this.registerFunction(id, func);
        } else if (func && !this.registry[id]) {
            this.registerFunction(id, func);
        }

        this.entries.push({
            ...entryOpts,
            funcId: id,
            funcArgs: entryOpts.funcArgs || [],
        });

        this.saveEntries();
    }

    public list(domain?: string): ContextMenuEntry[] {
        if (domain) return this.entries.filter((entry) => entry.domain === domain);
        return [...this.entries];
    }

    public delete(id: string): boolean {
        const length = this.entries.length;
        this.entries = this.entries.filter((entry) => entry.id !== id);

        if (this.entries.length < length) {
            this.saveEntries();
            return true;
        }

        return false;
    }

    public attach(element: HTMLElement, domain: string): void {
        element.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            this.closeMenu();
            this.renderMenu(event.clientX, event.clientY, domain);
        });
    }

    public renderMenu(x: number, y: number, domain: string): void {
        const entries = this.entries.filter((entry) => entry.domain === domain);
        if (entries.length === 0) return;

        this.menuEl = document.createElement('div');
        this.menuEl.classList.add('context-menu'); 
        this.menuEl.style.left = `${x}px`;
        this.menuEl.style.top = `${y}px`;

        entries.forEach((entry) => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('context-menu-item');
            menuItem.textContent = entry.title;

            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const func = this.registry[entry.funcId];

                if (func) {
                    try {
                        func(...(entry.funcArgs || []));
                    } catch (err) {
                        console.error(`Error executing "${entry.funcId}":`, err);
                    }
                } else {
                    console.warn(`No function registered for ID "${entry.funcId}"`);
                }

                this.closeMenu();
            });

            this.menuEl?.appendChild(menuItem);
        });

        document.body.appendChild(this.menuEl);
        const rect = this.menuEl.getBoundingClientRect();

        if (rect.right > window.innerWidth) this.menuEl.style.left = `${x - rect.width}px`;
        if (rect.bottom > window.innerHeight) this.menuEl.style.top = `${y - rect.height}px`;
    }

    public closeMenu(): void {
        if (this.menuEl) {
            this.menuEl.remove();
            this.menuEl = null;
        }
    }

    private saveEntries(): void {
        const serializable = this.entries.map(({ id, domain, title, funcId, funcArgs }) => ({
            id,
            domain,
            title,
            funcId,
            funcArgs,
        }));

        try {
            settings.set(ContextMenu.STORAGE_KEY, serializable);
        } catch (err) {
            console.error('Failed to save entries:', err);
        }
    }

    private loadEntries(): void {
        try {
            const stored = settings.get(ContextMenu.STORAGE_KEY);

            if (stored) {
                this.entries = stored;
                this.entries.forEach((entry) => {
                    if (!entry.funcArgs) entry.funcArgs = [];
                });
            }
        } catch (err) {
            console.error('Failed to load entries:', err);
            this.entries = [];
        }
    }
    private handleClick = (event: MouseEvent): void => {
        if (this.menuEl && !this.menuEl.contains(event.target as Node)) this.closeMenu();
    };
}