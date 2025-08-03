class Main {
    async init() {
        this.repoStore = window.xen.repos;
        this.packages = window.xen.packages;
        this.notifications = window.xen.notifications;
        this.dialog = window.xen.dialog;

        this.currentRepo = null;
        this.currentPackages = [];
        this.filteredPackages = [];
        this.installedPackages = new Set();

        this.repoStore.init();
        this.setupEventListeners();
        this.renderRepos();
        await this.loadInstalledPackages();
    }

    async loadInstalledPackages() {
        try {
            const apps = await this.packages.listApps();
            const libs = await this.packages.listLibs();

            [...apps, ...libs].forEach(pkg => {
                this.installedPackages.add(pkg.id);
            });
        } catch (error) {
            console.error('Failed to load installed packages:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('addRepoBtn').addEventListener('click', () => this.showAddRepoDialog());
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterPackages(e.target.value));
    }

    renderRepos() {
        const repoList = document.getElementById('repoList');
        const repos = this.repoStore.repos || [];

        repoList.innerHTML = '';

        repos.forEach(async (repo) => {
            let title = "";

            if (repo.type == 'xen') {
                const res = await window.xen.net.fetch(repo.url + 'manifest.json');
                const json = await res.json();

                title = json.title;
            } else {
                title = this.getRepoDisplayName(repo.url);
            }


            const repoItem = document.createElement('div');
            repoItem.className = 'repo-item';
            repoItem.innerHTML = `
                <div class="repo-info">
                    <div class="repo-name">${title}</div>
                    <div class="repo-url">${repo.url}</div>
                </div>
                <div class="repo-actions">
                    <button class="delete-repo-btn" data-url="${repo.url}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            repoItem.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-repo-btn')) {
                    this.selectRepo(repo);
                }
            });

            repoItem.querySelector('.delete-repo-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteRepoDialog(repo.url);
            });

            repoList.appendChild(repoItem);
        });
    }

    getRepoDisplayName(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    }

    async selectRepo(repo) {
        document.querySelectorAll('.repo-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');

        this.currentRepo = repo;
        this.showLoading();

        try {
            await this.loadRepoPackages(repo);
        } catch (error) {
            this.showError(`Failed to load packages from ${repo.url}`);
            console.error('Failed to load repo packages:', error);
        }
    }

    async loadRepoPackages(repo) {
        try {
            let repoManifest;
            try {
                repoManifest = await this.repoStore.getManifest(repo.url);
            } catch (error) {
                console.warn('Failed to load repo manifest:', error);
            }

            document.getElementById('repoTitle').textContent =
                repoManifest?.title || this.getRepoDisplayName(repo.url);
            document.getElementById('repoDescription').textContent =
                repoManifest?.description || `Packages from ${repo.url}`;

            const packageList = await this.repoStore.listPackages(repo.url, repo.type);
            this.currentPackages = [];

            if (repo.type === 'xen') {
                for (const packageId of packageList) {
                    try {
                        const packageManifest = await this.repoStore.getPackage(repo.url, packageId);
                        this.currentPackages.push({
                            id: packageId,
                            ...packageManifest,
                            repoType: 'xen'
                        });
                    } catch (error) {
                        console.warn(`Failed to load package ${packageId}:`, error);
                    }
                }
            } else if (repo.type === 'anura') {
                const allPackages = [...(packageList.apps || []), ...(packageList.libs || [])];
                this.currentPackages = allPackages.map(pkg => ({
                    id: pkg.package || pkg.name,
                    name: pkg.name,
                    description: pkg.desc || 'No description available',
                    icon: pkg.icon,
                    version: '1.0.0',
                    type: 'app',
                    repoType: 'anura',
                    anuraData: pkg
                }));
            }

            this.filteredPackages = [...this.currentPackages];
            this.renderPackages();

        } catch (error) {
            throw error;
        }
    }

    filterPackages(query) {
        if (!query.trim()) {
            this.filteredPackages = [...this.currentPackages];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredPackages = this.currentPackages.filter(pkg =>
                pkg.name.toLowerCase().includes(lowerQuery) ||
                pkg.description.toLowerCase().includes(lowerQuery)
            );
        }
        this.renderPackages();
    }

    renderPackages() {
        const packageGrid = document.getElementById('packageGrid');

        if (this.filteredPackages.length === 0) {
            packageGrid.innerHTML = `
                <div class="no-packages">
                    <i class="fas fa-box-open"></i>
                    <h3>No packages found</h3>
                    <p>Try adjusting your search or select a different repository</p>
                </div>
            `;
            return;
        }

        packageGrid.innerHTML = '';

        this.filteredPackages.forEach(pkg => {
            const isInstalled = this.installedPackages.has(pkg.id);
            const iconUrl = this.getPackageIconUrl(pkg);

            const packageCard = document.createElement('div');
            packageCard.className = 'package-card';
            packageCard.innerHTML = `
                <div class="package-header">
                    <div class="package-icon">
                        <img src="${iconUrl}" alt="${pkg.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <i class="fas fa-box" style="display: none;"></i>
                    </div>
                    <div class="package-info">
                        <div class="package-name">${pkg.name}</div>
                        <div class="package-description">${pkg.description}</div>
                    </div>
                </div>
                <div class="package-actions">
                    <div class="package-version">v${pkg.version || '1.0.0'}</div>
                    <button class="package-btn ${isInstalled ? 'installed' : ''}" 
                            data-package-id="${pkg.id}" 
                            ${isInstalled ? '' : ''}>
                        <i class="fas ${isInstalled ? 'fa-play' : 'fa-download'}"></i>
                        ${isInstalled ? 'Open' : 'Install'}
                    </button>
                </div>
            `;

            const btn = packageCard.querySelector('.package-btn');
            btn.addEventListener('click', () => {
                if (isInstalled) {
                    this.openPackage(pkg.id);
                } else {
                    this.installPackage(pkg);
                }
            });

            packageGrid.appendChild(packageCard);
        });
    }

    getPackageIconUrl(pkg) {
        if (pkg.repoType === 'xen') {
            if (pkg.icon) {
                return new URL(`packages/${pkg.id}/${pkg.icon}`, pkg.repoUrl || this.currentRepo.url).href;
            }
        } else if (pkg.repoType === 'anura') {
            if (pkg.icon) {
                return new URL(`${pkg.icon}`, this.currentRepo.url).href;
            }
        }

        return `${location.origin}/assets/logo.svg`;
    }

    async installPackage(pkg) {
        const btn = document.querySelector(`[data-package-id="${pkg.id}"]`);
        const originalContent = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Installing...';

        try {
            if (pkg.repoType === 'xen') {
                await this.repoStore.install(this.currentRepo.url, pkg.id, 'xen');
            } else if (pkg.repoType === 'anura') {
                await this.repoStore.install(this.currentRepo.url, pkg.id, 'anura', 'name');
            }

            this.installedPackages.add(pkg.id);
            btn.className = 'package-btn installed';
            btn.innerHTML = '<i class="fas fa-play"></i> Open';
            btn.disabled = false;

            this.notifications.spawn({
                title: 'Package Installed',
                description: `${pkg.name} has been installed successfully`,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });

        } catch (error) {
            btn.innerHTML = originalContent;
            btn.disabled = false;

            this.notifications.spawn({
                title: 'Installation Failed',
                description: `Failed to install ${pkg.name}: ${error.message}`,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 5000
            });

            console.error('Installation failed:', error);
        }
    }

    async openPackage(packageId) {
        try {
            await this.packages.open(packageId);
        } catch (error) {
            this.notifications.spawn({
                title: 'Failed to Open',
                description: `Could not open package: ${error.message}`,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
        }
    }

    async showAddRepoDialog() {
        const url = await this.dialog.prompt({
            title: 'Add Repository',
            body: 'Enter the repository URL:',
            placeholder: 'https://example.com'
        });

        if (!url) return;

        const type = await this.dialog.prompt({
            title: 'Repository Type',
            body: 'Enter repository type (xen or anura):',
            placeholder: 'xen'
        });

        if (!type || !['xen', 'anura'].includes(type.toLowerCase())) {
            this.notifications.spawn({
                title: 'Invalid Type',
                description: 'Repository type must be either "xen" or "anura"',
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
            return;
        }

        try {
            this.repoStore.addRepo(url, type.toLowerCase());
            this.renderRepos();

            this.notifications.spawn({
                title: 'Repository Added',
                description: `Successfully added ${url}`,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
        } catch (error) {
            this.notifications.spawn({
                title: 'Failed to Add Repository',
                description: error.message,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
        }
    }

    async showDeleteRepoDialog(url) {
        const confirmed = await this.dialog.confirm({
            title: 'Delete Repository',
            body: `Are you sure you want to remove ${url}?`,
            icon: `${location.origin}/assets/logo.svg`
        });

        if (!confirmed) return;

        try {
            this.repoStore.removeRepo(url);
            this.renderRepos();

            if (this.currentRepo && this.currentRepo.url === url) {
                this.currentRepo = null;
                this.showWelcome();
            }

            this.notifications.spawn({
                title: 'Repository Removed',
                description: `Successfully removed ${url}`,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
        } catch (error) {
            this.notifications.spawn({
                title: 'Failed to Remove Repository',
                description: error.message,
                icon: `${location.origin}/assets/logo.svg`,
                timeout: 3000
            });
        }
    }

    showLoading() {
        const packageGrid = document.getElementById('packageGrid');
        packageGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Loading packages...</h3>
            </div>
        `;
    }

    showError(message) {
        const packageGrid = document.getElementById('packageGrid');
        packageGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showWelcome() {
        const packageGrid = document.getElementById('packageGrid');
        packageGrid.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-box-open"></i>
                <h3>Welcome to the RepoStore!</h3>
                <p>Select a repository to browse available packages</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        if (!window.xen.settings.get('ft-repo')) {
            window.xen.settings.set('ft-repo', true);
            window.xen.dialog.alert({
                title: 'RepoStore',
                body: 'Welcome to the XenOS RepoStore! Here is where you can download and browse for applications. Please note this app is still in WiP! Currently Anura Repos are buggy and there are issues with state between the install/open button.',
                icon: '/assets/logo.svg'
            });
        }

        const m = new Main();
        await m.init();
    }, 500);
});