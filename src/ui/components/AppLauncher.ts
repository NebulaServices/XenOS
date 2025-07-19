/* TODO:
- App folders
- Make apps draggable
- Make launcher resizable
*/

import { PackageManager } from '../../apis/process/Packages';
import { Manifest } from '../../types/Process';

export class AppLauncher {
    private el: {
        launcher: HTMLDivElement;
        searchContainer: HTMLDivElement;
        searchInput: HTMLInputElement;
        grid: HTMLDivElement;
    };

    private isVisible = false;
    private apps: Manifest[] = [];

    constructor(
        private packageManager: PackageManager,
        private launcher: HTMLElement,
        private taskbar: HTMLElement,
    ) {
        this.el = {
            launcher: document.createElement('div'),
            searchContainer: document.createElement('div'),
            searchInput: document.createElement('input'),
            grid: document.createElement('div'),
        };

        this.setup();
    }

    private setup(): void {
        this.el.launcher.id = 'app-launcher';
        this.el.launcher.classList.add('app-launcher');
        this.el.searchContainer.classList.add('launcher-search-container');
        this.el.searchInput.type = 'text';
        this.el.searchInput.placeholder = 'Search your apps!';
        this.el.searchInput.classList.add('launcher-search-input');
        // Search icon, shout out to Gemini 2.5 (I need to find a real one)
        this.el.searchContainer.innerHTML = `
      <svg class="launcher-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    `;
        this.el.searchContainer.appendChild(this.el.searchInput);
        this.el.launcher.appendChild(this.el.searchContainer);
        this.el.grid.classList.add('app-grid');
        this.el.launcher.appendChild(this.el.grid);
        this.el.searchInput.addEventListener('input', () => this.filterApps());
    }

    public create(): void { document.body.appendChild(this.el.launcher); }
    public toggle(): void { this.isVisible ? this.hide() : this.show(); }

    public async show(): Promise<void> {
        if (this.isVisible) return;
        this.isVisible = true;

        const taskbarRect = this.taskbar.getBoundingClientRect();

        this.el.launcher.style.left = `${taskbarRect.left}px`;
        this.el.launcher.style.bottom = `${window.innerHeight - taskbarRect.top + 8}px`;
        this.el.launcher.classList.add('visible');
        this.apps = await this.packageManager.listApps();
        this.renderApps(this.apps);
        this.el.searchInput.focus();

        setTimeout(() => document.addEventListener('click', this.handleClick), 0);
    }

    public hide(): void {
        if (!this.isVisible) return;
        this.isVisible = false;
    
        this.el.launcher.classList.remove('visible');
        document.removeEventListener('click', this.handleClick);

        setTimeout(() => {
            if (!this.isVisible) {
                this.el.searchInput.value = '';
                this.el.grid.innerHTML = '';
            }
        }, 300);
    }

    private handleClick = (e: MouseEvent): void => {
        const path = e.composedPath();

        if (
            !path.includes(this.el.launcher) &&
            !path.includes(this.launcher)
        ) {
            this.hide();
        }
    };

    private filterApps(): void {
        const query = this.el.searchInput.value.toLowerCase();
        const filtered = this.apps.filter((app) => app.title.toLowerCase().includes(query));

        this.renderApps(filtered);
    }

    private renderApps(apps: Manifest[]): void {
        this.el.grid.innerHTML = '';

        try {
            apps.forEach((app, index) => {
                const entry = this.createEntry(app);

                (entry.style as any).transitionDelay = `${index * 20}ms`;
                this.el.grid.appendChild(entry);
            });
        } catch (err) {
            console.error('Failed to render apps:', err);
        }
    }

    private createEntry(app: Manifest): HTMLDivElement {
        const entry = document.createElement('div');
        entry.classList.add('app-entry');
        entry.title = app.title;

        const icon = document.createElement('img');
        icon.src = `/fs/apps/${app.id}/${app.icon}`;
        icon.alt = app.title;

        const name = document.createElement('span');
        name.textContent = app.title;

        entry.appendChild(icon);
        entry.appendChild(name);

        entry.addEventListener('click', () => {
            this.packageManager.open(app.id);
            this.hide();
        });

        return entry;
    }
}