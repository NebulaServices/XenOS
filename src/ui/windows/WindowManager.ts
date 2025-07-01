import { WindowOpts } from '../../types/global';
import { Window } from './Window';

export class WindowManager {
    public windows: Window[] = [];
    public container: HTMLDivElement;
    public onCreated: ((window: Window) => void) | null = null;
    public onClosed: ((window: Window) => void) | null = null;
    public onFocused: ((window: Window) => void) | null = null;
    private nzi = 100; // Next Z-Index

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'wm-desktop';

        document.body.appendChild(this.container);
    }

    create(opts: WindowOpts): Window {
        const win = new Window(opts, this);

        this.windows.push(win);
        this.onCreated?.(win);
        return win;
    }

    remove(win: Window): void {
        this.windows = this.windows.filter((w) => w !== win);
        this.onClosed?.(win);
        if (win.isFocused && this.windows.length > 0) this.focus(this.windows[this.windows.length - 1]);
    }

    focus(win: Window): void {
        this.windows.forEach((w) => { if (w !== win && w.isFocused) w._setFocusState(false); });
        win.el.window.style.zIndex = String(this.nzi++);
        win._setFocusState(true);

        this.windows.sort((a, b) => {
            const zA = parseInt(a.el.window.style.zIndex || '0');
            const zB = parseInt(b.el.window.style.zIndex || '0');

            return zA - zB;
        });

        this.onFocused?.(win);
    }
}