import { Window, WindowOpts } from "./Window";

export class WindowManager {
    public windows: Window[] = [];
    public container: HTMLDivElement;
    public onCreated: ((window: Window) => void) | null = null;
    public onClosed: ((window: Window) => void) | null = null;
    public onFocused: ((window: Window) => void) | null = null;
    private nzi = 100; // Next Z-Index
    private clampZones: Map<string, HTMLDivElement> = new Map();
    private clampedWindows: Map<string, Window[]> = new Map();
    private activeClampZone: string | null = null;

    constructor() {
        this.container = document.createElement("div");
        this.container.id = "wm-desktop";

        document.body.appendChild(this.container);
        this.setupClampZones();
        this.setupClampListeners();
    }

    private setupClampZones(): void {
        const zones = [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ];

        zones.forEach((zone) => {
            const el = document.createElement("div");

            el.className = `wm-clamp-zone wm-clamp-${zone}`;
            el.style.cssText = `
                position: absolute;
                background: rgba(245, 194, 231, 0.3);
                border: 2px solid #cba6f7;
                border-radius: 8px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease;
                z-index: 9999;
            `;

            this.container.appendChild(el);
            this.clampZones.set(zone, el);
            this.clampedWindows.set(zone, []);
        });
    }

    private setupClampListeners(): void {
        document.addEventListener("mousemove", (e) => {
            if (!this.isDraggingWindow()) return;

            const draggedWindow = this.getDraggedWindow();

            if (draggedWindow && !draggedWindow.props.resizable) {
                return;
            }

            const zone = this.getClampZone(e.clientX, e.clientY);
            this.showClampZone(zone);
        });

        document.addEventListener("mouseup", (e) => {
            if (this.activeClampZone && this.isDraggingWindow()) {
                const draggedWindow = this.getDraggedWindow();

                if (draggedWindow && draggedWindow.props.resizable) {
                    this.clampWindow(draggedWindow, this.activeClampZone);
                }
            }

            this.hideAllClampZones();
        });
    }

    private isDraggingWindow(): boolean {
        return document.querySelector(".wm-window.dragging") !== null;
    }

    private getDraggedWindow(): Window | null {
        const draggedEl = document.querySelector(
            ".wm-window.dragging",
        ) as HTMLDivElement;
        return this.windows.find((w) => w.el.window === draggedEl) || null;
    }

    private getClampZone(x: number, y: number): string | null {
        const threshold = 50;
        const w = window.innerWidth;
        const h = window.innerHeight - (window as any).xen.taskBar.getHeight();
        const cornerThreshold = 100;

        if (x < cornerThreshold && y < cornerThreshold) return "top-left";
        if (x > w - cornerThreshold && y < cornerThreshold) return "top-right";
        if (x < cornerThreshold && y > h - cornerThreshold) return "bottom-left";
        if (x > w - cornerThreshold && y > h - cornerThreshold)
            return "bottom-right";

        if (y < threshold) return "top";
        if (y > h - threshold) return "bottom";
        if (x < threshold) return "left";
        if (x > w - threshold) return "right";

        return null;
    }

    private showClampZone(zone: string | null): void {
        this.hideAllClampZones();

        if (!zone) return;

        this.activeClampZone = zone;
        const zoneEl = this.clampZones.get(zone);
        if (!zoneEl) return;

        const bounds = this.getClampBounds(zone);
        zoneEl.style.left = `${bounds.x}px`;
        zoneEl.style.top = `${bounds.y}px`;
        zoneEl.style.width = `${bounds.width}px`;
        zoneEl.style.height = `${bounds.height}px`;
        zoneEl.style.opacity = "1";
    }

    private hideAllClampZones(): void {
        this.clampZones.forEach((el) => (el.style.opacity = "0"));
        this.activeClampZone = null;
    }

    private getClampBounds(
        zone: string,
    ): { x: number; y: number; width: number; height: number } {
        const w = window.innerWidth;
        const h = window.innerHeight - (window as any).xen.taskBar.getHeight();

        switch (zone) {
            case "top":
                return { x: 0, y: 0, width: w, height: h / 2 };
            case "bottom":
                return { x: 0, y: h / 2, width: w, height: h / 2 };
            case "left":
                return { x: 0, y: 0, width: w / 2, height: h };
            case "right":
                return { x: w / 2, y: 0, width: w / 2, height: h };
            case "top-left":
                return { x: 0, y: 0, width: w / 2, height: h / 2 };
            case "top-right":
                return { x: w / 2, y: 0, width: w / 2, height: h / 2 };
            case "bottom-left":
                return { x: 0, y: h / 2, width: w / 2, height: h / 2 };
            case "bottom-right":
                return { x: w / 2, y: h / 2, width: w / 2, height: h / 2 };
            default:
                return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    public clampWindow(win: Window, zone: string): void {
        if (!win.props.resizable) return; // Only clamp resizable windows

        this.unclampWindow(win);

        win.og.clampWidth = win.props.width;
        win.og.clampHeight = win.props.height;
        win.og.clampX = win.props.x;
        win.og.clampY = win.props.y;

        const clampedInZone = this.clampedWindows.get(zone) || [];
        clampedInZone.push(win);
        this.clampedWindows.set(zone, clampedInZone);

        win.el.window.classList.add("wm-clamped");
        win.el.window.dataset.clampZone = zone;

        this.arrangeClampedWindows(zone);
    }

    public unclampWindow(win: Window): void {
        const currentZone = win.el.window.dataset.clampZone;
        if (!currentZone) return;

        const clampedInZone = this.clampedWindows.get(currentZone) || [];
        const filtered = clampedInZone.filter((w) => w !== win);
        this.clampedWindows.set(currentZone, filtered);

        win.el.window.classList.remove("wm-clamped");
        delete win.el.window.dataset.clampZone;

        if (win.og.clampWidth !== undefined) {
            win.props.width = win.og.clampWidth;
            win.props.height = win.og.clampHeight!;
            win.props.x = win.og.clampX!;
            win.props.y = win.og.clampY!;

            win.el.window.style.width = win.og.clampWidth;
            win.el.window.style.height = win.og.clampHeight!;
            win.el.window.style.left = `${win.og.clampX}px`;
            win.el.window.style.top = `${win.og.clampY}px`;

            delete win.og.clampWidth;
            delete win.og.clampHeight;
            delete win.og.clampX;
            delete win.og.clampY;
        }

        this.arrangeClampedWindows(currentZone);
    }

    private arrangeClampedWindows(zone: string): void {
        const windows = this.clampedWindows.get(zone) || [];
        if (windows.length === 0) return;

        const bounds = this.getClampBounds(zone);
        const isVerticalSplit = ["left", "right"].includes(zone);
        const isHorizontalSplit = ["top", "bottom"].includes(zone);

        windows.forEach((win, i) => {
            let x = bounds.x;
            let y = bounds.y;
            let width = bounds.width;
            let height = bounds.height;

            if (isVerticalSplit && windows.length > 1) {
                height = bounds.height / windows.length;
                y = bounds.y + i * height;
            } else if (isHorizontalSplit && windows.length > 1) {
                width = bounds.width / windows.length;
                x = bounds.x + i * width;
            } else if (windows.length > 1) {
                const cols = Math.ceil(Math.sqrt(windows.length));
                const rows = Math.ceil(windows.length / cols);
                const col = i % cols;
                const row = Math.floor(i / cols);

                width = bounds.width / cols;
                height = bounds.height / rows;
                x = bounds.x + col * width;
                y = bounds.y + row * height;
            }

            win.props.x = x;
            win.props.y = y;
            win.props.width = `${width}px`;
            win.props.height = `${height}px`;

            win.el.window.style.left = `${x}px`;
            win.el.window.style.top = `${y}px`;
            win.el.window.style.width = `${width}px`;
            win.el.window.style.height = `${height}px`;
        });
    }

    create(opts: WindowOpts): Window {
        const win = new Window(opts, this);

        this.windows.push(win);
        this.onCreated?.(win);
        return win;
    }

    remove(win: Window): void {
        this.unclampWindow(win);
        this.windows = this.windows.filter((w) => w !== win);
        this.onClosed?.(win);
        if (win.isFocused && this.windows.length > 0) {
            this.focus(this.windows[this.windows.length - 1]);
        }
    }

    focus(win: Window, z?: number): void {
        this.windows.forEach((w) => {
            if (w !== win && w.isFocused) w._setFocusState(false);
        });

        if (z) {
            win.el.window.style.zIndex = String(z);
        } else {
            win.el.window.style.zIndex = String(this.nzi++);
        }

        win._setFocusState(true);

        this.windows.sort((a, b) => {
            const zA = parseInt(a.el.window.style.zIndex || "0");
            const zB = parseInt(b.el.window.style.zIndex || "0");
            return zA - zB;
        });

        this.onFocused?.(win);
    }

    public update(): void {
        (window as any).xen.taskBar.render();
    }

    public handleWindowResize(): void {
        this.clampedWindows.forEach((windows, zone) => {
            if (windows.length > 0) {
                this.arrangeClampedWindows(zone);
            }
        });
    }
}