export interface SystrayOpts {
	id: string;
	icon: string;
	tooltip?: string;
	onLeftClick?: (ev: MouseEvent) => void;
	onRightClick?: (ev: MouseEvent) => void;
}

interface SystrayEntry extends SystrayOpts {
	element: HTMLDivElement;
}

export class Systray {
	private entries: Map<string, SystrayEntry> = new Map();
	private container: HTMLDivElement | null = null;

	constructor() {
		this.createContainer();
	}

	private createContainer(): void {
		this.container = document.createElement('div');
		this.container.classList.add('systray-container');
	}

	public getContainer(): HTMLDivElement | null {
		return this.container;
	}

	public register(opts: SystrayOpts): void {
		if (this.entries.has(opts.id)) {
			this.unregister(opts.id);
		}

		const element = this.createElement(opts);
		const entry: SystrayEntry = { ...opts, element };
		
		this.entries.set(opts.id, entry);
		this.container?.appendChild(element);
		this.animateIn(element);
	}

	public unregister(id: string): void {
		const entry = this.entries.get(id);
		if (!entry) return;

		this.animateOut(entry.element, () => {
			this.container?.removeChild(entry.element);
			this.entries.delete(id);
		});
	}

	private createElement(opts: SystrayOpts): HTMLDivElement {
		const element = document.createElement('div');
		element.classList.add('systray-item');
		element.dataset.id = opts.id;
		element.title = opts.tooltip;

		const icon = document.createElement('img');
		icon.classList.add('systray-icon');
		icon.src = opts.icon;
		icon.alt = opts.tooltip;
		icon.draggable = false;

		element.appendChild(icon);

		element.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			opts.onLeftClick?.(e);
		});

		element.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			e.stopPropagation();
			opts.onRightClick?.(e);
		});

		return element;
	}

	private animateIn(element: HTMLDivElement): void {
		element.style.transform = 'scale(0)';
		element.style.opacity = '0';
		element.offsetHeight;

		requestAnimationFrame(() => {
			element.style.transform = 'scale(1)';
			element.style.opacity = '1';
		});
	}

	private animateOut(element: HTMLDivElement, callback: () => void): void {
		element.style.transform = 'scale(0)';
		element.style.opacity = '0';

		setTimeout(callback, 200);
	}

	public destroy(): void {
		this.entries.clear();
		this.container?.remove();
	}
}