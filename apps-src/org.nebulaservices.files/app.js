class Main {
    constructor() {
        this.fs = window.xen.fs;
        this.dialog = window.xen.dialog;
        this.notifications = window.xen.notifications;
        this.contextMenu = window.xen.contextMenu;

        this.currentPath = '/usr';
        this.history = ['/usr'];
        this.historyIndex = 0;
        this.selectedItems = new Set();
        this.clipboard = { items: [], operation: null, sourcePath: null };
        this.isSelecting = false;
        this.selectionStart = null;

        this.init();
    }

    async init() {
        await this.fs.init();
        this.setupEventListeners();
        this.setupContextMenus();
        await this.loadMounts();
        await this.navigateTo('/usr');
    }

    setupEventListeners() {
        document.querySelector('.home-btn').addEventListener('click', () => {
            this.navigateTo('/usr');
        });

        document.querySelector('.back-btn').addEventListener('click', () => {
            this.goBack();
        });

        document.querySelector('.add-mount-btn').addEventListener('click', () => {
            this.addMount();
        });

        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.filterFiles(e.target.value);
        });

        const filesGrid = document.querySelector(/*'.files-grid'*/'.content-area');
        /*
        filesGrid.addEventListener('mousedown', (e) => {
            if (e.target === filesGrid) {
                this.startSelection(e);
            }
        });

        filesGrid.addEventListener('mousemove', (e) => {
            if (this.isSelecting) {
                this.updateSelection(e);
            }
        });

        filesGrid.addEventListener('mouseup', () => {
            this.endSelection();
        });
        */

        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    setupContextMenus() {
        this.contextMenu.attach(document.querySelector('.content-area'), {
            root: [
                {
                    title: 'New Folder',
                    onClick: () => { this.createFolder(); this.refresh(); }
                },
                {
                    title: 'New File',
                    onClick: () => { this.createFile(); this.refresh(); }
                },
                {
                    title: 'Upload File',
                    onClick: () => { this.uploadFile(); this.refresh(); }
                },
                {
                    title: 'Upload Folder',
                    onClick: () => { this.uploadFolder(); this.refresh(); }
                },
                {
                    title: 'Paste',
                    onClick: () => { this.refresh(); this.paste(); }
                },
                {
                    title: 'Refresh',
                    onclick: () => this.refresh()
                }
            ]
        });
    }

    async loadMounts() {
        const mountsList = document.querySelector('.mounts-list');
        mountsList.innerHTML = '';

        for (const [path, handle] of this.fs.mounts.entries()) {
            const mountItem = document.createElement('div');
            mountItem.className = 'mount-item';
            mountItem.innerHTML = `
                <i class="fas fa-hdd"></i>
                <span>${path}</span>
            `;

            mountItem.addEventListener('click', () => {
                this.navigateTo(path);
                document.querySelectorAll('.mount-item').forEach(item =>
                    item.classList.remove('active'));
                mountItem.classList.add('active');
            });

            mountsList.appendChild(mountItem);
        }
    }

    async addMount() {
        const h = await xen.FilePicker.pick({ mode: 'directory' });
        const path = h.path;

        if (path) {
            try {
                await this.fs.mount(path);
                await this.loadMounts();
                this.notifications.spawn({
                    title: 'Mount Added',
                    description: `Successfully mounted to ${path}`,
                    icon: '/assets/logo.svg'
                });
            } catch (error) {
                this.notifications.spawn({
                    title: 'Mount Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async navigateTo(path) {
        this.showLoading(true);
        this.selectedItems.clear();

        try {
            const entries = await this.fs.list(path);
            this.currentPath = path;

            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            if (this.history[this.history.length - 1] !== path) {
                this.history.push(path);
                this.historyIndex = this.history.length - 1;
            }

            this.updateBreadcrumb();
            this.updateBackButton();
            await this.renderFiles(entries);

        } catch (error) {
            this.notifications.spawn({
                title: 'Navigation Error',
                description: error.message,
                icon: '/assets/logo.svg'
            });
        } finally {
            this.showLoading(false);
        }
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const path = this.history[this.historyIndex];
            this.navigateTo(path);
        }
    }

    updateBreadcrumb() {
        const breadcrumb = document.querySelector('.breadcrumb');
        const parts = this.currentPath.split('/').filter(Boolean);

        breadcrumb.innerHTML = '';

        const rootItem = document.createElement('span');
        rootItem.className = 'breadcrumb-item';
        rootItem.textContent = '/';
        rootItem.addEventListener('click', () => this.navigateTo('/'));
        breadcrumb.appendChild(rootItem);

        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += '/' + part;

            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            breadcrumb.appendChild(separator);

            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = part;

            const pathToNavigate = currentPath;
            item.addEventListener('click', () => this.navigateTo(pathToNavigate));

            breadcrumb.appendChild(item);
        });
    }

    updateBackButton() {
        const backBtn = document.querySelector('.back-btn');
        backBtn.disabled = this.historyIndex <= 0;
    }

    async renderFiles(entries) {
        const filesGrid = document.querySelector('.files-grid');
        const emptyState = document.querySelector('.empty-state');

        if (entries.length === 0) {
            filesGrid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        entries.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        filesGrid.innerHTML = '';

        for (const entry of entries) {
            const fileItem = await this.createFileItem(entry);
            filesGrid.appendChild(fileItem);
        }
    }

    async createFileItem(entry) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.name = entry.name;
        fileItem.dataset.isDirectory = entry.isDirectory;

        const icon = document.createElement('div');
        icon.className = 'file-icon';

        const name = document.createElement('div');
        name.className = 'file-name';
        name.textContent = entry.name;

        if (entry.isDirectory) {
            icon.innerHTML = '<i class="fas fa-folder"></i>';
        } else {
            const fullPath = `${this.currentPath}/${entry.name}`;
            const mimeType = this.getMimeType(entry.name);

            if (mimeType && mimeType.startsWith('image/')) {
                try {
                    const blob = await this.fs.read(fullPath, 'blob');

                    if (blob.size < 5 * 1024 * 1024) {
                        const img = document.createElement('img');
                        const url = URL.createObjectURL(blob);

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = 48;
                        canvas.height = 48;

                        const tempImg = new Image();
                        tempImg.onload = () => {
                            ctx.drawImage(tempImg, 0, 0, 48, 48);

                            canvas.toBlob((thumbnailBlob) => {
                                const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
                                img.src = thumbnailUrl;
                                img.onload = () => {
                                    URL.revokeObjectURL(url);
                                    URL.revokeObjectURL(thumbnailUrl);
                                };
                            }, 'image/jpeg', 0.8);
                        };
                        tempImg.src = url;

                        icon.appendChild(img);
                    } else {
                        icon.innerHTML = this.getFileIcon(mimeType);
                    }
                } catch {
                    icon.innerHTML = this.getFileIcon(mimeType);
                }
            } else {
                icon.innerHTML = this.getFileIcon(mimeType);
            }
        }

        fileItem.appendChild(icon);
        fileItem.appendChild(name);

        fileItem.addEventListener('click', (e) => {
            this.handleFileClick(e, entry);
        });

        fileItem.addEventListener('dblclick', () => {
            this.handleFileDoubleClick(entry);
        });

        const contextMenuOptions = {
            root: [
                {
                    title: 'Open',
                    onClick: () => {this.openFile(entry); this.refresh(); }
                },
                {
                    title: 'Cut',
                    onClick: () => { this.cut([entry]); this.refresh(); }
                },
                {
                    title: 'Copy',
                    onClick: () => { this.copy([entry]); this.refresh(); }
                },
                {
                    title: 'Rename',
                    onClick: () => { this.rename(entry); this.refresh(); }
                },
                {
                    title: 'Delete',
                    onClick: () => { this.deleteWithConfirmation([entry]); this.refresh(); }
                },
                {
                    title: 'Download',
                    onClick: () => { this.download(entry); this.refresh(); }
                },
                {
                    title: 'Compress',
                    onClick: () => { this.compress(entry); this.refresh(); }
                },
                {
                    title: 'Decompress',
                    onClick: () => { this.decompress(entry); this.refresh(); }
                },             
            ]
        };

        this.contextMenu.attach(fileItem, contextMenuOptions);
        return fileItem;
    }

    getMimeType(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            'txt': 'text/plain',
            'md': 'text/markdown',
            'markdown': 'text/markdown',

            'js': 'text/javascript',
            'mjs': 'text/javascript',
            'jsx': 'text/javascript',
            'ts': 'text/typescript',
            'tsx': 'text/typescript',
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'json': 'application/json',

            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',

            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mov': 'video/quicktime',
            'webm': 'video/webm',
            'ts': 'video/mp2t',
            'mpg': 'video/mpeg',
            'mpeg': 'video/mpeg',

            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',

            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

            'zip': 'application/zip',

        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('text/') || mimeType === 'application/json' ||
            mimeType.includes('yaml') || mimeType.includes('toml')) {
            return '<i class="fas fa-file-alt"></i>';
        }

        if (mimeType.includes('javascript') || mimeType.includes('typescript')) {
            return '<i class="fas fa-file-code"></i>';
        }

        if (mimeType.startsWith('image/')) {
            return '<i class="fas fa-file-image"></i>';
        }

        if (mimeType.startsWith('video/')) {
            return '<i class="fas fa-file-video"></i>';
        }

        if (mimeType.startsWith('audio/')) {
            return '<i class="fas fa-file-audio"></i>';
        }

        if (mimeType === 'application/pdf') {
            return '<i class="fas fa-file-pdf"></i>';
        }
        if (mimeType.includes('word') || mimeType.includes('document')) {
            return '<i class="fas fa-file-word"></i>';
        }
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            return '<i class="fas fa-file-excel"></i>';
        }
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
            return '<i class="fas fa-file-powerpoint"></i>';
        }

        if (mimeType.includes('zip')) {
            return '<i class="fas fa-file-archive"></i>';
        }

        return '<i class="fas fa-file"></i>';
    }

    handleFileClick(e, entry) {
        if (e.ctrlKey || e.metaKey) {
            this.toggleSelection(entry.name);
        } else if (e.shiftKey && this.selectedItems.size > 0) {
            this.selectRange(entry.name);
        } else {
            this.selectedItems.clear();
            this.selectedItems.add(entry.name);
        }
        this.updateSelectionUI();
    }

    async handleFileDoubleClick(entry) {
        if (entry.isDirectory) {
            await this.navigateTo(`${this.currentPath}/${entry.name}`);
        } else {
            await this.openFile(entry);
        }
    }

    async openFile(entry) {
        const fullPath = `${this.currentPath}/${entry.name}`;
        try {
            await this.fs.open(fullPath);
        } catch (error) {
            this.notifications.spawn({
                title: 'Open Failed',
                description: error.message,
                icon: '/assets/logo.svg'
            });
        }
    }

    toggleSelection(name) {
        if (this.selectedItems.has(name)) {
            this.selectedItems.delete(name);
        } else {
            this.selectedItems.add(name);
        }
    }

    selectRange(endName) {
        const items = Array.from(document.querySelectorAll('.file-item'));
        const startIndex = items.findIndex(item => this.selectedItems.has(item.dataset.name));
        const endIndex = items.findIndex(item => item.dataset.name === endName);

        if (startIndex !== -1 && endIndex !== -1) {
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);

            for (let i = start; i <= end; i++) {
                this.selectedItems.add(items[i].dataset.name);
            }
        }
    }

    updateSelectionUI() {
        document.querySelectorAll('.file-item').forEach(item => {
            if (this.selectedItems.has(item.dataset.name)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    startSelection(e) {
        this.isSelecting = true;
        this.selectionStart = { x: e.clientX, y: e.clientY };

        const selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        selectionBox.style.left = e.clientX + 'px';
        selectionBox.style.top = e.clientY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        document.body.appendChild(selectionBox);
        this.selectionBox = selectionBox;
    }

    updateSelection(e) {
        if (!this.isSelecting || !this.selectionBox) return;

        const rect = {
            left: Math.min(this.selectionStart.x, e.clientX),
            top: Math.min(this.selectionStart.y, e.clientY),
            right: Math.max(this.selectionStart.x, e.clientX),
            bottom: Math.max(this.selectionStart.y, e.clientY)
        };

        this.selectionBox.style.left = rect.left + 'px';
        this.selectionBox.style.top = rect.top + 'px';
        this.selectionBox.style.width = (rect.right - rect.left) + 'px';
        this.selectionBox.style.height = (rect.bottom - rect.top) + 'px';

        this.selectedItems.clear();
        document.querySelectorAll('.file-item').forEach(item => {
            const itemRect = item.getBoundingClientRect();
            if (itemRect.left < rect.right && itemRect.right > rect.left &&
                itemRect.top < rect.bottom && itemRect.bottom > rect.top) {
                this.selectedItems.add(item.dataset.name);
            }
        });
        this.updateSelectionUI();
    }

    endSelection() {
        this.isSelecting = false;
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }

    filterFiles(query) {
        const items = document.querySelectorAll('.file-item');
        items.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'c':
                    e.preventDefault();
                    this.copySelected();
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelected();
                    break;
                case 'v':
                    e.preventDefault();
                    this.paste();
                    break;
            }
        } else if (e.key === 'Delete') {
            this.deleteSelected();
        } else if (e.key === 'F2') {
            this.renameSelected();
        }
    }

    selectAll() {
        document.querySelectorAll('.file-item').forEach(item => {
            this.selectedItems.add(item.dataset.name);
        });
        this.updateSelectionUI();
    }

    copySelected() {
        const selected = Array.from(this.selectedItems);
        if (selected.length > 0) {
            this.clipboard = {
                items: selected,
                operation: 'copy',
                sourcePath: this.currentPath
            };
        }
    }

    cutSelected() {
        const selected = Array.from(this.selectedItems);
        if (selected.length > 0) {
            this.clipboard = {
                items: selected,
                operation: 'cut',
                sourcePath: this.currentPath
            };
        }
    }

    generateUniqueFileName(baseName, extension = '') {
        let counter = 1;
        let newName = extension ? `${baseName} copy.${extension}` : `${baseName} copy`;

        while (this.fileExists(newName)) {
            newName = extension ? `${baseName} copy ${counter}.${extension}` : `${baseName} copy ${counter}`;
            counter++;
        }

        return newName;
    }

    fileExists(fileName) {
        const items = document.querySelectorAll('.file-item');
        return Array.from(items).some(item => item.dataset.name === fileName);
    }

    async paste() {
        if (this.clipboard.items.length === 0) return;

        try {
            for (const item of this.clipboard.items) {
                const srcPath = `${this.clipboard.sourcePath}/${item}`;
                let destName = item;

                if (this.clipboard.operation === 'copy' && this.clipboard.sourcePath === this.currentPath) {
                    const parts = item.split('.');
                    if (parts.length > 1) {
                        const extension = parts.pop();
                        const baseName = parts.join('.');
                        destName = this.generateUniqueFileName(baseName, extension);
                    } else {
                        destName = this.generateUniqueFileName(item);
                    }
                }

                const destPath = `${this.currentPath}/${destName}`;

                const sourceExists = await this.fs.exists(srcPath);
                if (!sourceExists) {
                    this.notifications.spawn({
                        title: 'Paste Failed',
                        description: `Source file "${item}" no longer exists`,
                        icon: '/assets/logo.svg'
                    });
                    continue;
                }

                if (this.clipboard.operation === 'copy') {
                    await this.fs.copy(srcPath, destPath);
                } else if (this.clipboard.operation === 'cut') {
                    await this.fs.move(srcPath, destPath);
                }
            }

            if (this.clipboard.operation === 'cut') {
                this.clipboard = { items: [], operation: null, sourcePath: null };
            }

            await this.refresh();
        } catch (error) {
            this.notifications.spawn({
                title: 'Paste Failed',
                description: error.message,
                icon: '/assets/logo.svg'
            });
        }
    }


    async deleteSelected() {
        const selected = Array.from(this.selectedItems);
        if (selected.length === 0) return;

        await this.deleteWithConfirmation(selected.map(name => ({ name })));
    }

    async renameSelected() {
        if (this.selectedItems.size !== 1) return;

        const name = Array.from(this.selectedItems)[0];
        await this.rename({ name });
    }

    async createFolder() {
        const name = await this.dialog.prompt({
            title: 'New Folder',
            body: 'Enter folder name:',
            placeholder: 'New Folder'
        });

        if (name) {
            try {
                await this.fs.mkdir(`${this.currentPath}/${name}`);
                await this.refresh();
            } catch (error) {
                this.notifications.spawn({
                    title: 'Create Folder Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async createFile() {
        const name = await this.dialog.prompt({
            title: 'New File',
            body: 'Enter file name:',
            placeholder: 'new-file.txt'
        });

        if (name) {
            try {
                await this.fs.write(`${this.currentPath}/${name}`, '');
                await this.refresh();
            } catch (error) {
                this.notifications.spawn({
                    title: 'Create File Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async uploadFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            const filePath = `${this.currentPath}/${file.name}`;

            await this.fs.write(filePath, file);
            await this.refresh();

            this.notifications.spawn({
                title: 'Upload Successful',
                description: `Uploaded ${file.name}`,
                icon: '/assets/logo.svg'
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.notifications.spawn({
                    title: 'Upload Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async uploadFolder() {
        try {
            const dirHandle = await window.showDirectoryPicker();
            const folderPath = `${this.currentPath}/${dirHandle.name}`;

            await this.fs.mkdir(folderPath);

            await this.uploadDirectoryContents(dirHandle, folderPath);
            await this.refresh();

            this.notifications.spawn({
                title: 'Upload Successful',
                description: `Uploaded folder ${dirHandle.name}`,
                icon: '/assets/logo.svg'
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.notifications.spawn({
                    title: 'Upload Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async uploadDirectoryContents(dirHandle, targetPath) {
        for await (const entry of dirHandle.values()) {
            const entryPath = `${targetPath}/${entry.name}`;

            if (entry.kind === 'file') {
                const file = await entry.getFile();
                await this.fs.write(entryPath, file);
            } else if (entry.kind === 'directory') {
                await this.fs.mkdir(entryPath);
                await this.uploadDirectoryContents(entry, entryPath);
            }
        }
    }

    async rename(entry) {
        const newName = await this.dialog.prompt({
            title: 'Rename',
            body: 'Enter new name:',
            placeholder: entry.name
        });

        if (newName && newName !== entry.name) {
            try {
                const oldPath = `${this.currentPath}/${entry.name}`;
                const newPath = `${this.currentPath}/${newName}`;
                await this.fs.move(oldPath, newPath);
                await this.refresh();
            } catch (error) {
                this.notifications.spawn({
                    title: 'Rename Failed',
                    description: error.message,
                    icon: '/assets/logo.svg'
                });
            }
        }
    }

    async deleteWithConfirmation(entries) {
        const confirmed = await this.dialog.confirm({
            title: 'Delete Items',
            body: `Are you sure you want to delete ${entries.length} item(s)? This action cannot be undone.`
        });

        if (confirmed) {
            await this.delete(entries);
        }
    }

    async delete(entries) {
        try {
            for (const entry of entries) {
                await this.fs.rm(`${this.currentPath}/${entry.name}`);
            }
            this.selectedItems.clear();
            await this.refresh();

            this.notifications.spawn({
                title: 'Delete Successful',
                description: `Deleted ${entries.length} item(s)`,
                icon: '/assets/logo.svg'
            });
        } catch (error) {
            this.notifications.spawn({
                title: 'Delete Failed',
                description: error.message,
                icon: '/assets/logo.svg'
            });
        }
    }

    async download(entry) {
        try {
            await this.fs.download(`${this.currentPath}/${entry.name}`);
        } catch (error) {
            this.notifications.spawn({
                title: 'Download Failed',
                description: error.message,
                icon: '/assets/logo.svg'
            });
        }
    }

    async compress(entry) {
        try {
            await this.fs.compress(`${this.currentPath}/${entry.name}`, `${this.currentPath}/${entry.name}.zip`).then(async () => {
                await this.refresh();
            });
        } catch (err) {
            this.notifications.spawn({
                title: 'Failed to Compress',
                description: err.message,
                icon: '/assets/logo.svg'
            });
        }
    }

    async decompress(entry) {
        try {
            await this.fs.decompress(`${this.currentPath}/${entry.name}`, `${this.currentPath}/${entry.name.split('.zip')[0]}`).then(async () => {
                await this.refresh();
            });
        } catch (err) {
            this.notifications.spawn({
                title: 'Failed to Decompress',
                description: err.message,
                icon: '/assets/logo.svg'
            });
        }
    }

    copy(entries) {
        this.clipboard = {
            items: entries.map(e => e.name),
            operation: 'copy',
            sourcePath: this.currentPath
        };
    }

    cut(entries) {
        this.clipboard = {
            items: entries.map(e => e.name),
            operation: 'cut',
            sourcePath: this.currentPath
        };
    }

    showLoading(show) {
        const loading = document.querySelector('.loading-indicator');
        loading.style.display = show ? 'flex' : 'none';
    }

    async refresh() {
        await this.navigateTo(this.currentPath);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new Main();
    }, 100);
});