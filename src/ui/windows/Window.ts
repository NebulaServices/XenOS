import { WindowOpts } from '../../types/UI';
import { WindowManager } from './WindowManager';
import { v4 as uuidv4 } from 'uuid';

export class Window {
    public readonly id: string;
    public props: {
        x: number;
        y: number;
        width: string;
        height: string;
        title: string;
        icon?: string;
        url?: string;
        content?: string;
        resizable?: boolean;
    } = {} as any;
    public is: {
        minimized: boolean;
        fullscreened: boolean;
        focused: boolean;
    } = {} as any;
    public el: {
        window: HTMLDivElement;
        bar: HTMLDivElement;
        content: HTMLIFrameElement | HTMLDivElement;
    } = {} as any;
    public og: {
        width: string;
        height: string;
        x: number;
        y: number;
    } = {} as any;

    constructor(
        opts: WindowOpts,
        private wm: WindowManager,
    ) {
        this.id = uuidv4();
        this.props.title = opts.title;
        this.props.icon = this.encodeUrl(opts.icon);
        this.props.url = opts.url;
        this.props.width = opts.width || '600px';
        this.props.height = opts.height || '400px';
        this.props.x = opts.x || Math.random() * (window.innerWidth - 600 - 50);
        this.props.y =
            opts.y || Math.random() * (window.innerHeight - 400 - 50);
        if (opts.resizable) {
            this.props.resizable = opts.resizable;
        } else {
            opts.resizable = true;
        }
        this.og.width = this.props.width;
        this.og.height = this.props.height;
        this.og.x = this.props.x;
        this.og.y = this.props.y;
        this.el.window = this.createWindowShell();
        this.wm.container.appendChild(this.el.window);
        this.createWindowContent();
        this.applyProps();
        this.setupButtons();
        this.focus();
    }

    private encodeUrl(url: string): string {
        let encoded: string;

        if (url.startsWith(location.origin)) return url;

        if (url.startsWith('http://') || url.startsWith('https://')) {
            // @ts-ignore
            encoded = __uv$config.prefix + __uv$config.encodeUrl(url);
        } else {
            encoded = url;
        }

        return encoded;
    }

    private createWindowShell(): HTMLDivElement {
        const el = document.createElement('div');
        el.classList.add('wm-window');
        el.style.zIndex = '1';

        this.el.bar = document.createElement('div');
        this.el.bar.classList.add('wm-title-bar');
        this.el.bar.innerHTML = `
            <div class="wm-title-left">
                ${this.props.icon
                ? `<img src="${this.props.icon}" class="wm-icon" alt="Window Icon" />`
                : ''
            }
                <span class="wm-title">${this.props.title}</span>
            </div>
            <div class="wm-title-right">
                <button class="wm-fullscreen-btn" title="Fullscreen"><div class="inner-square"></div></button>
                <button class="wm-minimize-btn" title="Minimize">&#x2212;</button>
                <button class="wm-close-btn" title="Close">&#x2715;</button>
            </div>
        `;

        el.appendChild(this.el.bar);

        if (this.props.resizable == true) {
            ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach((direction) => {
                const resizer = document.createElement('div');
                resizer.classList.add('wm-resizer', `wm-resizer-${direction}`);
                el.appendChild(resizer);
            });
        }

        return el;
    }

    private createWindowContent(): void {
        if (this.props.url) {
            this.el.content = document.createElement('iframe');
            this.el.content.classList.add('wm-content-frame');
            this.el.content.setAttribute('loading', 'lazy');
            this.el.content.setAttribute('allowfullscreen', 'true');

            this.el.window.appendChild(this.el.content);
            (this.el.content as HTMLIFrameElement).src = this.encodeUrl(this.props.url);

            this.el.content.onload = () => {
                Object.assign((this.el.content as HTMLIFrameElement).contentWindow, {
                    xen: window.xen,
                });
            }
        } else if (this.props.content) {
            const div = document.createElement('div');
            div.classList.add('wm-content');
            div.innerHTML = this.props.content || '';
            this.el.content = div;
            this.el.window.appendChild(this.el.content);
        }
    }

    private applyProps(): void {
        this.el.window.style.left = `${this.props.x}px`;
        this.el.window.style.top = `${this.props.y}px`;
        this.el.window.style.width = this.props.width;
        this.el.window.style.height = this.props.height;
    }

    private setupButtons(): void {
        let isDragging = false;
        let offsetX: number, offsetY: number;

        this.el.bar.addEventListener('mousedown', (e: MouseEvent) => {
            if (this.isMinimized || this.isFullscreened) return;

            isDragging = true;
            offsetX = e.clientX - this.el.window.getBoundingClientRect().left;
            offsetY = e.clientY - this.el.window.getBoundingClientRect().top;

            this.focus();
            document.body.classList.add('no-select');
            this.el.window.classList.add('dragging');
            this.el.content.classList.add('wm-iframe-no-pointer');
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isDragging) return;
            this.x = e.clientX - offsetX;
            this.y = e.clientY - offsetY;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;

                document.body.classList.remove('no-select');
                this.el.window.classList.remove('dragging');
                this.el.content.classList.remove('wm-iframe-no-pointer');
            }
        });

        this.el.window.querySelectorAll('.wm-resizer').forEach((resizerEl) => {
            const resizer = resizerEl as HTMLDivElement;
            let isResizing = false;
            let startX: number,
                startY: number,
                startWidth: number,
                startHeight: number,
                startLeft: number,
                startTop: number;

            resizer.addEventListener('mousedown', (e: MouseEvent) => {
                if (this.isMinimized || this.isFullscreened) return;

                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = this.el.window.offsetWidth;
                startHeight = this.el.window.offsetHeight;
                startLeft = this.el.window.offsetLeft;
                startTop = this.el.window.offsetTop;
                e.preventDefault();
                this.focus();
                document.body.classList.add('no-select');
                this.el.window.classList.add('resizing');
                this.el.content.classList.add('wm-iframe-no-pointer');
            });

            document.addEventListener('mousemove', (e: MouseEvent) => {
                if (!isResizing) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const direction = Array.from(resizer.classList).find((cls) =>
                    cls.startsWith('wm-resizer-'),
                )!;
                const minWidth = 200;
                const minHeight = 100;
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newX = startLeft;
                let newY = startTop;

                switch (direction) {
                    case 'wm-resizer-n':
                        newHeight = Math.max(minHeight, startHeight - dy);
                        newY = startTop + (startHeight - newHeight);
                        break;
                    case 'wm-resizer-s':
                        newHeight = Math.max(minHeight, startHeight + dy);
                        break;
                    case 'wm-resizer-e':
                        newWidth = Math.max(minWidth, startWidth + dx);
                        break;
                    case 'wm-resizer-w':
                        newWidth = Math.max(minWidth, startWidth - dx);
                        newX = startLeft + (startWidth - newWidth);
                        break;
                    case 'wm-resizer-nw':
                        newHeight = Math.max(minHeight, startHeight - dy);
                        newY = startTop + (startHeight - newHeight);
                        newWidth = Math.max(minWidth, startWidth - dx);
                        newX = startLeft + (startWidth - newWidth);
                        break;
                    case 'wm-resizer-ne':
                        newHeight = Math.max(minHeight, startHeight - dy);
                        newY = startTop + (startHeight - newHeight);
                        newWidth = Math.max(minWidth, startWidth + dx);
                        break;
                    case 'wm-resizer-sw':
                        newHeight = Math.max(minHeight, startHeight + dy);
                        newWidth = Math.max(minWidth, startWidth - dx);
                        newX = startLeft + (startWidth - newWidth);
                        break;
                    case 'wm-resizer-se':
                        newHeight = Math.max(minHeight, startHeight + dy);
                        newWidth = Math.max(minWidth, startWidth + dx);
                        break;
                }

                this.width = `${newWidth}px`;
                this.height = `${newHeight}px`;
                this.x = newX;
                this.y = newY;
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;

                    document.body.classList.remove('no-select');
                    this.el.window.classList.remove('resizing');
                    this.el.content.classList.remove('wm-iframe-no-pointer');
                }
            });
        });

        this.el.window.addEventListener('mousedown', (e: MouseEvent) => {
            if (
                e.target instanceof HTMLElement &&
                (e.target.closest('button') || e.target.closest('.wm-resizer'))
            ) {
                return;
            }

            this.focus();
            this.el.content.classList.add('wm-iframe-no-pointer');
        });

        this.el.window.addEventListener('mouseup', () => {
            setTimeout(() => {
                this.el.content.classList.remove('wm-iframe-no-pointer');
            }, 0);
        });

        this.el.bar
            .querySelector('.wm-close-btn')
            ?.addEventListener('click', () => this.close());
        this.el.bar
            .querySelector('.wm-minimize-btn')
            ?.addEventListener('click', () => this.minimize());
        this.el.bar
            .querySelector('.wm-fullscreen-btn')
            ?.addEventListener('click', () => this.fullscreen());
    }

    get x(): number {
        return this.props.x;
    }
    get y(): number {
        return this.props.y;
    }
    get width(): string {
        return this.props.width;
    }
    get height(): string {
        return this.props.height;
    }
    get title(): string {
        return this.props.title;
    }
    get icon(): string | undefined {
        return this.props.icon;
    }
    get url(): string {
        return this.props.url!;
    }
    get isFullscreened(): boolean {
        return this.is.fullscreened;
    }
    get isMinimized(): boolean {
        return this.is.minimized;
    }
    get isFocused(): boolean {
        return this.is.focused;
    }
    set x(val: number) {
        const maxX = window.innerWidth - this.el.window.offsetWidth;
        this.props.x = Math.min(Math.max(0, val), maxX);
        this.el.window.style.left = `${this.props.x}px`;
    }
    set y(val: number) {
        const maxY = window.innerHeight - this.el.window.offsetHeight;
        this.props.y = Math.min(Math.max(0, val), maxY);
        this.el.window.style.top = `${this.props.y}px`;
    }
    set width(val: string) {
        this.props.width = val;
        this.el.window.style.width = val;
        this.x = this.props.x;
    }
    set height(val: string) {
        this.props.height = val;
        this.el.window.style.height = val;
        this.y = this.props.y;
    }
    set title(val: string) {
        this.props.title = val;
        const el = this.el.bar.querySelector('.wm-title') as HTMLSpanElement;

        if (el) el.textContent = val;
        if (
            this.el.content instanceof HTMLIFrameElement &&
            this.el.content.contentDocument
        )
            this.el.content.contentDocument.title = val;
    }
    set icon(val: string | undefined) {
        this.props.icon = val;
        let el = this.el.bar.querySelector('.wm-icon') as HTMLImageElement;

        if (val) {
            if (el) {
                el.src = val;
            } else {
                el = document.createElement('img');
                el.src = val;
                el.classList.add('wm-icon');
                el.alt = 'Window Icon';
                this.el.bar.querySelector('.wm-title-left')?.prepend(el);
            }
        } else if (el) {
            el.remove();
        }
    }
    set url(val: string) {
        this.props.url = this.encodeUrl(val);
        if (this.el.content instanceof HTMLIFrameElement) {
            this.el.content.src = this.encodeUrl(val);
        }
    }
    close(): void {
        this.el.window.classList.add('closing');
        this.el.content.classList.add('wm-iframe-no-pointer');
        const dur = 200;

        setTimeout(() => {
            this.wm.remove(this);
            this.el.window.remove();
        }, dur);
    }
    minimize(): void {
        if (this.is.fullscreened) this.fullscreen();
        this.is.minimized = !this.is.minimized;
        this.el.window.classList.toggle('wm-minimized', this.is.minimized);

        if (!this.is.minimized) {
            this.focus();
        } else {
            this._setFocusState(false);
        }
    }
    fullscreen(): void {
        this.is.fullscreened = !this.is.fullscreened;
        this.el.window.classList.toggle('wm-fullscreen', this.is.fullscreened);
        this.el.content.classList.add('wm-iframe-no-pointer');

        if (this.is.fullscreened) {
            this.og.width = this.props.width;
            this.og.height = this.props.height;
            this.og.x = this.props.x;
            this.og.y = this.props.y;
            this.width = '100vw';
            this.height = '100vh';
            this.x = 0;
            this.y = 0;
        } else {
            this.width = this.og.width;
            this.height = this.og.height;
            this.x = this.og.x;
            this.y = this.og.y;
        }

        const dur = 250;

        setTimeout(() => {
            this.el.content.classList.remove('wm-iframe-no-pointer');
            this.focus();
        }, dur);
    }
    focus(): void {
        if (!this.is.minimized) this.wm.focus(this);
    }
    _setFocusState(is: boolean): void {
        this.is.focused = is;
        this.el.window.classList.toggle('wm-focused', is);
    }
}