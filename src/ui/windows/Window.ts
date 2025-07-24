import { WindowManager } from "./WindowManager";
import { v4 as uuidv4 } from "uuid";

export interface WindowOpts {
    title: string;
    width?: string;
    height?: string;
    x?: number;
    y?: number;
    icon?: string;
    url?: string;
    content?: string;
    resizable?: boolean;
    display?: boolean;
}

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
        display?: boolean;
    } = {} as any;
    public is: {
        minimized: boolean;
        fullscreened: boolean;
        focused: boolean;
    } = {} as any;
    public el: {
        window: HTMLDivElement;
        bar: HTMLDivElement;
        content: HTMLIFrameElement | HTMLDivElement | undefined;
    } = {} as any;
    public og: {
        width: string;
        height: string;
        x: number;
        y: number;
        clampWidth?: string;
        clampHeight?: string;
        clampX?: number;
        clampY?: number;
    } = {} as any;

    constructor(opts: WindowOpts, private wm: WindowManager) {
        this.id = uuidv4();
        this.props.title = opts.title;
        this.props.icon = window.xen.net.encodeUrl(opts.icon);
        this.props.url = opts.url;
        this.props.content = opts.content;
        this.props.width = opts.width || "600px";
        this.props.height = opts.height || "400px";
        this.props.x = opts.x || Math.random() * (window.innerWidth - 600 - 50);
        this.props.y =
            opts.y ||
            Math.random() *
            (window.innerHeight - 400 - window.xen.taskBar.getHeight() - 50);
        this.props.resizable = opts.resizable ?? true;
        this.props.display = opts.display ?? true;
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
        this.display = this.props.display;
    }

    private createWindowShell(): HTMLDivElement {
        const el = document.createElement("div");
        el.classList.add("wm-window");
        el.style.zIndex = "1";

        this.el.bar = document.createElement("div");
        this.el.bar.classList.add("wm-title-bar");
        this.el.bar.innerHTML = `
            <div class="wm-title-left">
                ${this.props.icon
                ? `<img src="${this.props.icon}" class="wm-icon" alt="Window Icon" />`
                : ""
            }
                <span class="wm-title">${this.props.title}</span>
            </div>
            <div class="wm-title-right">
                ${this.props.resizable !== false
                ? `<button class="wm-fullscreen-btn" title="Fullscreen"><img src="/assets/wm-fullscreen.png" alt="Fullscreen" style="width: 16px; height: 16px;"/></button>`
                : ""
            }
                <button class="wm-minimize-btn" title="Minimize"><img src="/assets/wm-minimize.png" alt="Minimize" style="width: 16px; height: 16px;"/></button>
                <button class="wm-close-btn" title="Close"><img src="/assets/wm-close.png" alt="Close" style="width: 16px; height: 16px;"/></button>
            </div>
        `;

        el.appendChild(this.el.bar);

        if (this.props.resizable == true) {
            ["n", "s", "e", "w", "nw", "ne", "sw", "se"].forEach((d) => {
                const r = document.createElement("div");

                r.classList.add("wm-resizer", `wm-resizer-${d}`);
                el.appendChild(r);
            });
        }

        return el;
    }

    private createWindowContent(): void {
        if (this.props.url) {
            this.el.content = document.createElement("iframe");
            this.el.content.classList.add("wm-content-frame");
            this.el.content.setAttribute("loading", "lazy");
            this.el.content.setAttribute("allowfullscreen", "true");

            this.el.window.appendChild(this.el.content);
            (this.el.content as HTMLIFrameElement).src = window.xen.net.encodeUrl(
                this.props.url,
            );

            this.el.content.onload = () => {
                Object.assign((this.el.content as HTMLIFrameElement).contentWindow, {
                    xen: (window as any).xen,
                });
            };
        } else if (this.props.content) {
            const d = document.createElement("div");

            d.classList.add("wm-content-frame");
            d.innerHTML = this.props.content || "";

            this.el.content = d;
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
        let oX: number, oY: number;
        let dragStartY: number;

        this.el.bar.addEventListener("mousedown", (e: MouseEvent) => {
            if (this.isMinimized || !this.props.display) return;

            isDragging = true;
            dragStartY = e.clientY;
            oX = e.clientX - this.el.window.getBoundingClientRect().left;
            oY = e.clientY - this.el.window.getBoundingClientRect().top;

            this.focus();
            document.body.classList.add("no-select");
            this.el.window.classList.add("dragging");
            if (this.el.content) {
                this.el.content.classList.add("wm-iframe-no-pointer");
            }
        });

        document.addEventListener("mousemove", (e: MouseEvent) => {
            if (!isDragging) return;

            if (this.isFullscreened && e.clientY - dragStartY > 50) {
                this.fullscreen();
                oX = this.el.window.offsetWidth / 2;
                oY = 20;

                return;
            }

            if (this.el.window.classList.contains("wm-clamped")) {
                this.wm.unclampWindow(this);
            }

            if (!this.isFullscreened) {
                this.x = e.clientX - oX;
                this.y = e.clientY - oY;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;

                document.body.classList.remove("no-select");
                this.el.window.classList.remove("dragging");
                if (this.el.content) {
                    this.el.content.classList.remove("wm-iframe-no-pointer");
                }
            }
        });

        this.el.window.querySelectorAll(".wm-resizer").forEach((rEl) => {
            const r = rEl as HTMLDivElement;
            let isResizing = false;
            let sX: number, sY: number, sW: number, sH: number, sL: number, sT: number;

            r.addEventListener("mousedown", (e: MouseEvent) => {
                if (this.isMinimized || this.isFullscreened || !this.props.display)
                    return;

                if (this.el.window.classList.contains("wm-clamped")) {
                    this.wm.unclampWindow(this);
                }

                isResizing = true;
                sX = e.clientX;
                sY = e.clientY;
                sW = this.el.window.offsetWidth;
                sH = this.el.window.offsetHeight;
                sL = this.el.window.offsetLeft;
                sT = this.el.window.offsetTop;

                e.preventDefault();
                this.focus();

                document.body.classList.add("no-select");
                this.el.window.classList.add("resizing");
                if (this.el.content) {
                    this.el.content.classList.add("wm-iframe-no-pointer");
                }
            });

            document.addEventListener("mousemove", (e: MouseEvent) => {
                if (!isResizing) return;

                const dX = e.clientX - sX;
                const dY = e.clientY - sY;
                const d = Array.from(r.classList).find((cls) =>
                    cls.startsWith("wm-resizer-"),
                )!;
                const minW = 200;
                const minH = 100;
                let nW = sW;
                let nH = sH;
                let nX = sL;
                let nY = sT;

                switch (d) {
                    case "wm-resizer-n":
                        nH = Math.max(minH, sH - dY);
                        nY = sT + (sH - nH);
                        break;
                    case "wm-resizer-s":
                        nH = Math.max(minH, sH + dY);
                        const maxHeight =
                            window.innerHeight - sT - (window as any).xen.taskBar.getHeight();
                        nH = Math.min(nH, maxHeight);
                        break;
                    case "wm-resizer-e":
                        nW = Math.max(minW, sW + dX);
                        break;
                    case "wm-resizer-w":
                        nW = Math.max(minW, sW - dX);
                        nX = sL + (sW - nW);
                        break;
                    case "wm-resizer-nw":
                        nH = Math.max(minH, sH - dY);
                        nY = sT + (sH - nH);
                        nW = Math.max(minW, sW - dX);
                        nX = sL + (sW - nW);
                        break;
                    case "wm-resizer-ne":
                        nH = Math.max(minH, sH - dY);
                        nY = sT + (sH - nH);
                        nW = Math.max(minW, sW + dX);
                        break;
                    case "wm-resizer-se":
                        nH = Math.max(minH, sH + dY);
                        nW = Math.max(minW, sW + dX);

                        const maxHeightSE =
                            window.innerHeight - sT - (window as any).xen.taskBar.getHeight();
                        nH = Math.min(nH, maxHeightSE);
                        break;
                    case "wm-resizer-sw":
                        nH = Math.max(minH, sH + dY);
                        nW = Math.max(minW, sW - dX);
                        nX = sL + (sW - nW);

                        const maxHeightSW =
                            window.innerHeight - sT - (window as any).xen.taskBar.getHeight();
                        nH = Math.min(nH, maxHeightSW);
                        break;
                }

                this.width = `${nW}px`;
                this.height = `${nH}px`;
                this.x = nX;
                this.y = nY;
            });

            document.addEventListener("mouseup", () => {
                if (isResizing) {
                    isResizing = false;

                    document.body.classList.remove("no-select");
                    this.el.window.classList.remove("resizing");
                    if (this.el.content) {
                        this.el.content.classList.remove("wm-iframe-no-pointer");
                    }
                }
            });
        });

        this.el.window.addEventListener("mousedown", (e: MouseEvent) => {
            if (
                e.target instanceof HTMLElement &&
                (e.target.closest("button") || e.target.closest(".wm-resizer"))
            ) {
                return;
            }
            if (!this.props.display) return;

            this.focus();
            if (this.el.content) {
                this.el.content.classList.add("wm-iframe-no-pointer");
            }
        });

        this.el.window.addEventListener("mouseup", () => {
            setTimeout(() => {
                if (this.el.content) {
                    this.el.content.classList.remove("wm-iframe-no-pointer");
                }
            }, 0);
        });

        this.el.bar
            .querySelector(".wm-close-btn")
            ?.addEventListener("click", () => this.close());
        this.el.bar
            .querySelector(".wm-minimize-btn")
            ?.addEventListener("click", () => this.minimize());
        this.el.bar
            .querySelector(".wm-fullscreen-btn")
            ?.addEventListener("click", () => this.fullscreen());
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
    get display(): boolean {
        return this.props.display ?? true;
    }

    set x(v: number) {
        const mX = window.innerWidth - this.el.window.offsetWidth;
        this.props.x = Math.min(Math.max(0, v), mX);
        this.el.window.style.left = `${this.props.x}px`;
    }
    set y(v: number) {
        const mY =
            window.innerHeight -
            this.el.window.offsetHeight -
            (window as any).xen.taskBar.getHeight();
        this.props.y = Math.min(Math.max(0, v), mY);
        this.el.window.style.top = `${this.props.y}px`;
    }
    set width(v: string) {
        this.props.width = v;
        this.el.window.style.width = v;
        this.x = this.props.x;
    }
    set height(v: string) {
        this.props.height = v;
        this.el.window.style.height = v;
        this.y = this.props.y;
    }
    set title(v: string) {
        this.props.title = v;
        const el = this.el.bar.querySelector(".wm-title") as HTMLSpanElement;

        if (el) el.textContent = v;
        if (
            this.el.content instanceof HTMLIFrameElement &&
            this.el.content.contentDocument
        )
            this.el.content.contentDocument.title = v;
    }
    set icon(v: string | undefined) {
        this.props.icon = v;
        let el = this.el.bar.querySelector(".wm-icon") as HTMLImageElement;

        if (v) {
            if (el) {
                el.src = v;
            } else {
                el = document.createElement("img");
                el.src = v;
                el.classList.add("wm-icon");
                el.alt = "Window Icon";
                this.el.bar.querySelector(".wm-title-left")?.prepend(el);
            }
        } else if (el) {
            el.remove();
        }
    }
    set url(v: string) {
        this.props.url = window.xen.net.encodeUrl(v);

        if (this.el.content instanceof HTMLIFrameElement) {
            this.el.content.src = window.xen.net.encodeUrl(v);
        }
    }
    set display(v: boolean) {
        this.props.display = v;
        this.el.window.style.visibility = v ? "visible" : "hidden";
        this.el.window.style.pointerEvents = v ? "auto" : "none";

        if (!v) {
            this._setFocusState(false);
        } else {
            this.focus();
        }
    }

    close(): void {
        this.el.window.classList.add("closing");

        if (this.el.content) {
            this.el.content.classList.add("wm-iframe-no-pointer");
        }

        const d = 200;

        setTimeout(() => {
            this.wm.remove(this);
            this.el.window.remove();
        }, d);
    }
    minimize(): void {
        if (this.is.fullscreened) this.fullscreen();
        this.is.minimized = !this.is.minimized;
        this.el.window.classList.toggle("wm-minimized", this.is.minimized);

        if (!this.is.minimized) {
            this.focus();
        } else {
            this._setFocusState(false);
        }
    }
    fullscreen(): void {
        if (!this.props.resizable) return;

        this.is.fullscreened = !this.is.fullscreened;
        this.el.window.classList.toggle("wm-fullscreen", this.is.fullscreened);

        if (this.el.content) {
            this.el.content.classList.add("wm-iframe-no-pointer");
        }

        if (this.is.fullscreened) {
            this.og.width = this.props.width;
            this.og.height = this.props.height;
            this.og.x = this.props.x;
            this.og.y = this.props.y;

            this.el.window.style.width = "100%";
            this.el.window.style.height = "100%";
            this.el.window.style.left = "0px";
            this.el.window.style.top = "0px";

            this.props.width = "100%";
            this.props.height = "100%";
            this.props.x = 0;
            this.props.y = 0;
        } else {
            this.el.window.style.width = this.og.width;
            this.el.window.style.height = this.og.height;
            this.el.window.style.left = `${this.og.x}px`;
            this.el.window.style.top = `${this.og.y}px`;

            this.props.width = this.og.width;
            this.props.height = this.og.height;
            this.props.x = this.og.x;
            this.props.y = this.og.y;
        }

        setTimeout(() => {
            if (this.el.content) {
                this.el.content.classList.remove("wm-iframe-no-pointer");
            }

            this.focus();
        }, 300);
    }
    focus(): void {
        if (!this.is.minimized && this.props.display) this.wm.focus(this);
    }
    _setFocusState(is: boolean): void {
        this.is.focused = is;
        this.el.window.classList.toggle("wm-focused", is);
    }
}