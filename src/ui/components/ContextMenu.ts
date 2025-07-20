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
	private menuEl: HTMLDivElement | null = null;
	private submenuEl: HTMLDivElement | null = null;
	private attachments = new Map<HTMLElement, ContextMenuOptions>();

	constructor() {
		document.addEventListener('click', this.handleClick);
	}

	public attach(elementOrId: string | HTMLElement, options: ContextMenuOptions): void {
		let el: HTMLElement | null;
		
		if (typeof elementOrId === 'string') {
			el = document.getElementById(elementOrId);
		} else {
			el = elementOrId;
		}
		
		if (!el) return;

		this.attachments.delete(el);
		this.attachments.set(el, options);

		el.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.closeMenu();
			this.renderMenu(e.clientX, e.clientY, options);
		});
	}

	private renderMenu(x: number, y: number, opts: ContextMenuOptions): void {
		this.menuEl = document.createElement('div');
		this.menuEl.classList.add('context-menu');

		const rootEntries = opts.root || [];
		const folders = Object.keys(opts).filter(k => k !== 'root');

		rootEntries.forEach(entry => {
			this.createMenuItem(entry);
		});

		if (rootEntries.length > 0 && folders.length > 0) {
			this.createSeparator();
		}

		folders.forEach(folderName => {
			this.createFolderItem(folderName, opts[folderName]);
		});

		document.body.appendChild(this.menuEl);
		
		const rect = this.menuEl.getBoundingClientRect();
		this.menuEl.style.left = `${x}px`;
		this.menuEl.style.top = `${y - rect.height - 10}px`;
		
		this.positionMenu(x, y);
	}

	private createMenuItem(entry: ContextMenuEntry): void {
		const item = document.createElement('div');
		item.classList.add('context-menu-item');

		if (entry.icon) {
			const icon = document.createElement('img');
			icon.src = entry.icon;
			icon.classList.add('menu-icon');
			item.appendChild(icon);
		}

		const text = document.createElement('span');
		text.textContent = entry.title;
		item.appendChild(text);

		if (entry.toggle !== undefined) {
			const check = document.createElement('span');
			check.classList.add('toggle-check');
			check.textContent = entry.toggle ? '✓' : '';
			item.appendChild(check);
		}

		item.addEventListener('click', (e) => {
			e.stopPropagation();
			entry.onClick?.();
			this.closeMenu();
		});

		this.menuEl?.appendChild(item);
	}

	private createFolderItem(folderName: string, entries: ContextMenuEntry[]): void {
		const folderEl = document.createElement('div');
		folderEl.classList.add('context-menu-folder');
		
		const text = document.createElement('span');
		text.textContent = folderName;
		folderEl.appendChild(text);
		
		const arrow = document.createElement('span');
		arrow.classList.add('folder-arrow');
		arrow.textContent = '>';
		folderEl.appendChild(arrow);

		folderEl.addEventListener('mouseenter', (e) => {
			this.showSubmenu(folderEl, entries);
		});

		folderEl.addEventListener('mouseleave', (e) => {
			setTimeout(() => {
				if (!this.submenuEl?.matches(':hover') && !folderEl.matches(':hover')) {
					this.hideSubmenu();
				}
			}, 100);
		});

		this.menuEl?.appendChild(folderEl);
	}

	private showSubmenu(folderEl: HTMLDivElement, entries: ContextMenuEntry[]): void {
		this.hideSubmenu();

		this.submenuEl = document.createElement('div');
		this.submenuEl.classList.add('context-menu', 'context-submenu');

		entries.forEach(entry => {
			const item = document.createElement('div');
			item.classList.add('context-menu-item');

			if (entry.icon) {
				const icon = document.createElement('img');
				icon.src = entry.icon;
				icon.classList.add('menu-icon');
				item.appendChild(icon);
			}

			const text = document.createElement('span');
			text.textContent = entry.title;
			item.appendChild(text);

			if (entry.toggle !== undefined) {
				const check = document.createElement('span');
				check.classList.add('toggle-check');
				check.textContent = entry.toggle ? '✓' : '';
				item.appendChild(check);
			}

			item.addEventListener('click', (e) => {
				e.stopPropagation();
				entry.onClick?.();
				this.closeMenu();
			});

			this.submenuEl?.appendChild(item);
		});

		const folderRect = folderEl.getBoundingClientRect();

		this.submenuEl.style.left = `${folderRect.right + 5}px`;
		this.submenuEl.style.top = `${folderRect.top}px`;
		this.submenuEl.addEventListener('mouseenter', () => {});

		this.submenuEl.addEventListener('mouseleave', () => {
			setTimeout(() => {
				if (!folderEl.matches(':hover')) {
					this.hideSubmenu();
				}
			}, 100);
		});

		document.body.appendChild(this.submenuEl);

		const submenuRect = this.submenuEl.getBoundingClientRect();

		if (submenuRect.right > window.innerWidth) {
			this.submenuEl.style.left = `${folderRect.left - submenuRect.width - 5}px`;
		}
		if (submenuRect.bottom > window.innerHeight) {
			this.submenuEl.style.top = `${window.innerHeight - submenuRect.height - 10}px`;
		}
	}

	private hideSubmenu(): void {
		if (this.submenuEl) {
			this.submenuEl.remove();
			this.submenuEl = null;
		}
	}

	private createSeparator(): void {
		const sep = document.createElement('div');

		sep.classList.add('context-menu-separator');
		this.menuEl?.appendChild(sep);
	}

	private positionMenu(x: number, y: number): void {
		if (!this.menuEl) return;
		const rect = this.menuEl.getBoundingClientRect();

		if (rect.right > window.innerWidth) {
			this.menuEl.style.left = `${x - rect.width}px`;
		}

		if (rect.top < 0) {
			this.menuEl.style.top = `${y + 10}px`;
		}
	}

	public closeMenu(): void {
		if (this.menuEl) {
			this.menuEl.remove();
			this.menuEl = null;
		}

		this.hideSubmenu();
	}

	private handleClick = (e: MouseEvent): void => {
		if (this.menuEl && !this.menuEl.contains(e.target as Node) && 
			(!this.submenuEl || !this.submenuEl.contains(e.target as Node))) {
			this.closeMenu();
		}
	};
}