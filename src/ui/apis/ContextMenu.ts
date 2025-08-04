interface ContextMenuEntry {
	title: string;
	icon?: string;
	toggle?: boolean;
	once?: boolean;
	onClick?: (...args: any[]) => void;
}

interface ContextMenuOptions {
	[folder: string]: ContextMenuEntry[];
}

export class ContextMenu {
	private menu: HTMLElement | null = null;
	private submenu: HTMLElement | null = null;
	private attachments = new Map<HTMLElement, ContextMenuOptions>();

	constructor() {
		this.bindEvents();
	}

	attach(el: string | HTMLElement, opts: ContextMenuOptions): void {
		const target = typeof el === 'string' ? document.getElementById(el) : el;
		if (!target) return;

		this.attachments.set(target, opts);
		target.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.show(e.clientX, e.clientY, opts);
		});
	}

	private show(x: number, y: number, opts: ContextMenuOptions): void {
		this.hide();

		this.menu = this.createElement('div', 'context-menu');

		const root = opts.root || [];
		const folders = Object.keys(opts).filter(k => k !== 'root');

		root.forEach(entry => this.addItem(this.menu!, entry));

		if (root.length && folders.length) {
			this.addSeparator(this.menu!);
		}

		folders.forEach(name => this.addFolder(this.menu!, name, opts[name]));

		document.body.appendChild(this.menu);
		this.position(this.menu, x, y);
	}

	private addItem(parent: HTMLElement, entry: ContextMenuEntry): void {
		const item = this.createElement('div', 'context-menu-item');

		if (entry.icon) {
			const icon = this.createElement('img', 'menu-icon') as HTMLImageElement;
			icon.src = entry.icon;
			item.appendChild(icon);
		}

		const text = this.createElement('span');
		text.textContent = entry.title;
		item.appendChild(text);

		if (entry.toggle !== undefined) {
			const check = this.createElement('span', 'toggle-check');
			check.textContent = entry.toggle ? '✓' : '';
			item.appendChild(check);
		}

		item.addEventListener('click', (e) => {
			e.stopPropagation();
			entry.onClick?.();
			this.hide();
		});

		parent.appendChild(item);
	}

	private addFolder(parent: HTMLElement, name: string, entries: ContextMenuEntry[]): void {
		const folder = this.createElement('div', 'context-menu-folder');

		const text = this.createElement('span');
		text.textContent = name;
		folder.appendChild(text);

		const arrow = this.createElement('span', 'folder-arrow');
		arrow.textContent = '▶';
		folder.appendChild(arrow);

		let timeout: number;

		folder.addEventListener('mouseenter', () => {
			clearTimeout(timeout);
			this.showSubmenu(folder, entries);
		});

		folder.addEventListener('mouseleave', () => {
			timeout = window.setTimeout(() => {
				if (!this.isHovering(this.submenu) && !this.isHovering(folder)) {
					this.hideSubmenu();
				}
			}, 150);
		});

		parent.appendChild(folder);
	}

	private showSubmenu(folder: HTMLElement, entries: ContextMenuEntry[]): void {
		this.hideSubmenu();

		this.submenu = this.createElement('div', 'context-menu context-submenu');
		entries.forEach(entry => this.addItem(this.submenu!, entry));

		document.body.appendChild(this.submenu);

		const folderRect = folder.getBoundingClientRect();
		const x = folderRect.right + 5;
		const y = folderRect.top;

		this.position(this.submenu, x, y);

		let timeout: number;
		this.submenu.addEventListener('mouseleave', () => {
			timeout = window.setTimeout(() => {
				if (!this.isHovering(folder)) {
					this.hideSubmenu();
				}
			}, 150);
		});

		this.submenu.addEventListener('mouseenter', () => {
			clearTimeout(timeout);
		});
	}

	private hideSubmenu(): void {
		this.submenu?.remove();
		this.submenu = null;
	}

	private addSeparator(parent: HTMLElement): void {
		parent.appendChild(this.createElement('div', 'context-menu-separator'));
	}

	private position(el: HTMLElement, x: number, y: number): void {
		// Force layout calculation
		el.style.visibility = 'hidden';
		el.style.left = '0px';
		el.style.top = '0px';

		// Force reflow to get accurate dimensions
		el.offsetHeight;

		const rect = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let finalX = x;
		let finalY = y;

		// Check right edge
		if (x + rect.width > vw) {
			finalX = x - rect.width;
		}

		// Check bottom edge  
		if (y + rect.height > vh) {
			finalY = y - rect.height;
		}

		// Ensure minimum margins
		finalX = Math.max(5, Math.min(finalX, vw - rect.width - 5));
		finalY = Math.max(5, Math.min(finalY, vh - rect.height - 5));

		el.style.left = `${finalX}px`;
		el.style.top = `${finalY}px`;
		el.style.visibility = 'visible';
	}

	private hide(): void {
		this.menu?.remove();
		this.menu = null;
		this.hideSubmenu();
	}

	private createElement(tag: string, className?: string): HTMLElement {
		const el = document.createElement(tag);
		if (className) el.className = className;
		return el;
	}

	private isHovering(el: HTMLElement | null): boolean {
		return el?.matches(':hover') || false;
	}

	private bindEvents(): void {
		document.addEventListener('click', (e) => {
			if (!this.menu?.contains(e.target as Node) &&
				!this.submenu?.contains(e.target as Node)) {
				this.hide();
			}
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && (this.menu || this.submenu)) {
				e.preventDefault();
				this.hide();
			}
		});
	}
}