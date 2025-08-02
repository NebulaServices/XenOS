import { XenFS } from "./XenFS";

interface FilePickerResult {
    path: string | string[];
    stat: any | any[];
    url?: string | string[];
}

interface FilePickerOptions {
    title?: string;
    multiple?: boolean;
    mode?: "file" | "directory";
}

export class FilePicker {
    private fs: XenFS;
    private currentPath: string = "/";
    private selectedFiles: Set<string> = new Set();
    private options: FilePickerOptions;
    private resolve: ((result: FilePickerResult | null) => void) | null = null;
    private el: {
        overlay: HTMLDivElement;
        modal: HTMLDivElement;
        header: HTMLDivElement;
        pathBar: HTMLDivElement;
        content: HTMLDivElement;
        footer: HTMLDivElement;
    };

    constructor(options: FilePickerOptions = {}) {
        this.fs = window.xen.fs;
        this.options = {
            title: "Select a File",
            mode: "file",
            ...options,
        };
        this.currentPath = "/";
        this.loadFontAwesome();
        this.createElements();
        this.setupEvents();
        this.setupContextMenu();
    }

    private loadFontAwesome(): void {
        if (!document.querySelector('link[href*="fontawesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    private getFileIcon(name: string, mime: string, isDirectory: boolean): { icon: string; color: string } {
        if (isDirectory) {
            return { icon: "fa-solid fa-folder", color: "#fab387" };
        }

        const ext = name.split('.').pop()?.toLowerCase() || '';

        if (mime?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) {
            return { icon: "fa-solid fa-image", color: "#a6e3a1" };
        }

        if (mime?.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'].includes(ext)) {
            return { icon: "fa-solid fa-video", color: "#f9e2af" };
        }

        if (mime?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
            return { icon: "fa-solid fa-music", color: "#cba6f7" };
        }

        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
            return { icon: "fa-solid fa-file-zipper", color: "#f38ba8" };
        }

        if (['pdf'].includes(ext)) {
            return { icon: "fa-solid fa-file-pdf", color: "#f38ba8" };
        }

        if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
            return { icon: "fa-solid fa-file-word", color: "#74c0fc" };
        }

        if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
            return { icon: "fa-solid fa-file-excel", color: "#a6e3a1" };
        }

        if (['ppt', 'pptx', 'odp'].includes(ext)) {
            return { icon: "fa-solid fa-file-powerpoint", color: "#fab387" };
        }

        if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
            return { icon: "fa-brands fa-js-square", color: "#f9e2af" };
        }

        if (['html', 'htm', 'xml'].includes(ext)) {
            return { icon: "fa-brands fa-html5", color: "#fab387" };
        }

        if (['css', 'scss', 'sass', 'less'].includes(ext)) {
            return { icon: "fa-brands fa-css3-alt", color: "#74c0fc" };
        }

        if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
            return { icon: "fa-solid fa-gears", color: "#f9e2af" };
        }

        if (['md', 'markdown', 'txt'].includes(ext)) {
            return { icon: "fa-solid fa-file-lines", color: "#cdd6f4" };
        }

        return { icon: "fa-solid fa-file", color: "#a6adc8" };
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    private isImageFile(name: string, mime: string): boolean {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        return mime?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext);
    }

    private async createImagePreview(filePath: string): Promise<HTMLElement | null> {
        try {
            const content = await this.fs.read(filePath, "blob");
            if (content instanceof Blob) {
                const url = URL.createObjectURL(content);
                const img = document.createElement("img");
                img.src = url;
                img.className = "file-item-preview";

                img.onload = () => URL.revokeObjectURL(url);
                img.onerror = () => URL.revokeObjectURL(url);

                return img;
            }
        } catch (error) {
            console.warn("Failed to create image preview:", error);
        }
        return null;
    }

    private createElements(): void {
        this.el = {} as any;

        this.el.overlay = document.createElement("div");
        this.el.overlay.className = "file-picker-overlay";

        this.el.modal = document.createElement("div");
        this.el.modal.className = "file-picker-modal";

        this.el.header = document.createElement("div");
        this.el.header.className = "file-picker-header";

        const title = document.createElement("h3");
        title.textContent = this.options.title!;

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.className = "file-picker-close-btn";
        closeBtn.onclick = () => this.close(null);

        this.el.header.appendChild(title);
        this.el.header.appendChild(closeBtn);

        this.el.pathBar = document.createElement("div");
        this.el.pathBar.className = "file-picker-path";

        this.el.content = document.createElement("div");
        this.el.content.className = "file-picker-content";

        this.el.footer = document.createElement("div");
        this.el.footer.className = "file-picker-footer";

        const selectedInfo = document.createElement("div");
        selectedInfo.className = "file-picker-selected-info";

        const buttons = document.createElement("div");
        buttons.className = "file-picker-buttons";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "file-picker-btn file-picker-btn-cancel";
        cancelBtn.onclick = () => this.close(null);

        const selectBtn = document.createElement("button");
        selectBtn.textContent = this.options.mode === "directory" ? "Select Folder" : "Select";
        selectBtn.className = "file-picker-btn file-picker-btn-select select-btn";
        selectBtn.disabled = true;
        selectBtn.onclick = () => this.selectFiles();

        buttons.appendChild(cancelBtn);
        buttons.appendChild(selectBtn);

        this.el.footer.appendChild(selectedInfo);
        this.el.footer.appendChild(buttons);

        this.el.modal.appendChild(this.el.header);
        this.el.modal.appendChild(this.el.pathBar);
        this.el.modal.appendChild(this.el.content);
        this.el.modal.appendChild(this.el.footer);
        this.el.overlay.appendChild(this.el.modal);
    }

    private setupEvents(): void {
        this.el.overlay.onclick = (e) => {
            if (e.target === this.el.overlay) this.close(null);
        };

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.close(null);
        });
    }

    private updatePathBar(): void {
        this.el.pathBar.innerHTML = "";

        const parts = this.currentPath.split("/").filter(Boolean);

        const rootBtn = document.createElement("button");
        rootBtn.innerHTML = '<i class="fa-solid fa-house"></i>';
        rootBtn.className = "file-picker-path-btn";
        rootBtn.onclick = () => this.navigateTo("/");
        this.el.pathBar.appendChild(rootBtn);

        for (let i = 0; i < parts.length; i++) {
            const separator = document.createElement("span");
            separator.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            separator.className = "file-picker-path-separator";
            this.el.pathBar.appendChild(separator);

            const partBtn = document.createElement("button");
            partBtn.textContent = parts[i];
            partBtn.className = "file-picker-path-btn";

            const path = "/" + parts.slice(0, i + 1).join("/");
            partBtn.onclick = () => this.navigateTo(path);
            this.el.pathBar.appendChild(partBtn);
        }
    }

    private async updateContent(): Promise<void> {
        this.el.content.innerHTML = "";

        try {
            const entries = await this.fs.list(this.currentPath);

            const entriesWithStats = await Promise.all(
                entries.map(async (entry) => {
                    try {
                        const fullPath = `${this.currentPath}/${entry.name}`.replace(/\/+/g, "/");
                        const stat = await this.fs.stat(fullPath);
                        return { ...entry, stat };
                    } catch {
                        return { ...entry, stat: null };
                    }
                })
            );

            entriesWithStats.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            for (const entry of entriesWithStats) {
                const item = document.createElement("div");
                item.className = "file-item";
                item.dataset.name = entry.name;
                item.dataset.isDirectory = entry.isDirectory.toString();

                const iconInfo = this.getFileIcon(entry.name, entry.stat?.mime || '', entry.isDirectory);

                const isImage = !entry.isDirectory && this.isImageFile(entry.name, entry.stat?.mime || '');

                if (isImage) {
                    const fullPath = `${this.currentPath}/${entry.name}`.replace(/\/+/g, "/");
                    const preview = await this.createImagePreview(fullPath);

                    if (preview) {
                        item.appendChild(preview);
                    } else {
                        const icon = document.createElement("i");
                        icon.className = `${iconInfo.icon} file-item-icon`;
                        icon.style.color = iconInfo.color;
                        item.appendChild(icon);
                    }
                } else {
                    const icon = document.createElement("i");
                    icon.className = `${iconInfo.icon} file-item-icon`;
                    icon.style.color = iconInfo.color;
                    item.appendChild(icon);
                }

                const details = document.createElement("div");
                details.className = "file-item-details";

                const name = document.createElement("div");
                name.textContent = entry.name;
                name.className = "file-item-name";

                const meta = document.createElement("div");
                meta.className = "file-item-meta";

                if (entry.isDirectory) {
                    meta.innerHTML = '<i class="fa-solid fa-folder"></i> Folder';
                } else if (entry.stat) {
                    const size = this.formatFileSize(entry.stat.size);
                    const date = entry.stat.lastModified.toLocaleDateString();
                    meta.innerHTML = `<i class="fa-solid fa-file"></i> ${size} • ${date}`;
                }

                details.appendChild(name);
                details.appendChild(meta);
                item.appendChild(details);

                item.onclick = (e) => this.handleItemClick(e, entry.name, entry.isDirectory);
                item.ondblclick = () => {
                    if (entry.isDirectory) {
                        this.navigateTo(`${this.currentPath}/${entry.name}`);
                    }
                };

                this.el.content.appendChild(item);
            }

            if (entries.length === 0) {
                const empty = document.createElement("div");
                empty.className = "file-picker-empty";

                const emptyIcon = document.createElement("i");
                emptyIcon.className = "fa-solid fa-folder-open file-picker-empty-icon";

                const emptyText = document.createElement("div");
                emptyText.textContent = "This folder is empty";

                empty.appendChild(emptyIcon);
                empty.appendChild(emptyText);
                this.el.content.appendChild(empty);
            }

        } catch (error) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "file-picker-error";

            const errorIcon = document.createElement("i");
            errorIcon.className = "fa-solid fa-triangle-exclamation file-picker-error-icon";

            const errorText = document.createElement("div");
            errorText.textContent = `Error: ${error}`;

            errorDiv.appendChild(errorIcon);
            errorDiv.appendChild(errorText);
            this.el.content.appendChild(errorDiv);
        }
    }

    private handleItemClick(e: MouseEvent, name: string, isDirectory: boolean): void {
        if (isDirectory && this.options.mode === "file") {
            this.navigateTo(`${this.currentPath}/${name}`);
            return;
        }

        if (!this.options.multiple) {
            this.selectedFiles.clear();
            this.selectedFiles.add(name);
        } else {
            if (e.ctrlKey || e.metaKey) {
                if (this.selectedFiles.has(name)) {
                    this.selectedFiles.delete(name);
                } else {
                    this.selectedFiles.add(name);
                }
            } else if (e.shiftKey && this.selectedFiles.size > 0) {
                const items = Array.from(this.el.content.querySelectorAll('.file-item'));
                const currentIndex = items.findIndex(item => (item as HTMLElement).dataset.name === name);
                const lastSelectedName = Array.from(this.selectedFiles).pop();
                const lastIndex = items.findIndex(item =>  (item as HTMLElement).dataset.name === lastSelectedName);

                const start = Math.min(currentIndex, lastIndex!);
                const end = Math.max(currentIndex, lastIndex!);

                for (let i = start; i <= end; i++) {
                    const itemName =  (items[i] as HTMLElement).dataset.name!;
                    this.selectedFiles.add(itemName);
                }
            } else {
                this.selectedFiles.clear();
                this.selectedFiles.add(name);
            }
        }

        this.updateSelection();
    }

    private updateSelection(): void {
        const items = this.el.content.querySelectorAll('.file-item');
        items.forEach(item => {
            const name = (item as HTMLElement).dataset.name!;
            item.classList.remove('selected', 'multi-selected');

            if (this.selectedFiles.has(name)) {
                if (this.selectedFiles.size === 1) {
                    item.classList.add('selected');
                } else {
                    item.classList.add('multi-selected');
                }
            }
        });

        const selectedInfo = this.el.footer.querySelector(".file-picker-selected-info") as HTMLDivElement;
        const selectBtn = this.el.footer.querySelector(".select-btn") as HTMLButtonElement;

        if (this.selectedFiles.size === 0) {
            selectedInfo.innerHTML = "";
            selectBtn.disabled = true;
        } else if (this.selectedFiles.size === 1) {
            const name = Array.from(this.selectedFiles)[0];
            selectedInfo.innerHTML = `<i class="fa-solid fa-check"></i> Selected: ${name}`;
            selectBtn.disabled = false;
        } else {
            selectedInfo.innerHTML = `<i class="fa-solid fa-check"></i> Selected: ${this.selectedFiles.size} items`;
            selectBtn.disabled = false;
        }
    }

    private async navigateTo(path: string): Promise<void> {
        try {
            const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");
            const exists = await this.fs.exists(normalized);

            if (!exists) {
                throw new Error("Path does not exist");
            }

            this.currentPath = normalized;
            this.selectedFiles.clear();

            this.updatePathBar();
            await this.updateContent();
            this.updateSelection();
        } catch (error) {
            console.error("Navigation error:", error);
        }
    }

    private async selectFiles(): Promise<void> {
        if (this.selectedFiles.size === 0) return;

        try {
            const selectedArray = Array.from(this.selectedFiles);

            if (selectedArray.length === 1) {
                const name = selectedArray[0];
                const filePath = `${this.currentPath}/${name}`.replace(/\/+/g, "/");

                if (this.options.mode === "directory") {
                    const stat = await this.fs.stat(filePath);
                    const result: FilePickerResult = {
                        path: filePath,
                        stat
                    };
                    this.close(result);
                    return;
                }

                const stat = await this.fs.stat(filePath);
                const content = await this.fs.read(filePath, "blob");

                let url: string | undefined;
                if (content instanceof Blob) {
                    url = URL.createObjectURL(content);
                }

                const result: FilePickerResult = {
                    path: filePath,
                    stat,
                    url
                };

                this.close(result);
            } else {
                const results = await Promise.all(
                    selectedArray.map(async (name) => {
                        const filePath = `${this.currentPath}/${name}`.replace(/\/+/g, "/");
                        const stat = await this.fs.stat(filePath);

                        if (this.options.mode === "directory") {
                            return { path: filePath, stat, content: null };
                        }

                        const content = await this.fs.read(filePath, "blob");
                        let url: string | undefined;
                        if (content instanceof Blob) {
                            url = URL.createObjectURL(content);
                        }
                        return { path: filePath, stat, content, url };
                    })
                );

                const result: FilePickerResult = {
                    path: results.map(r => r.path),
                    stat: results.map(r => r.stat),
                    url: results.map(r => r.url).filter(Boolean) as string[]
                };

                this.close(result);
            }
        } catch (error) {
            console.error("Error selecting files:", error);
        }
    }

    private close(result: FilePickerResult | null): void {
        document.body.removeChild(this.el.overlay);
        this.resolve?.(result);
    }

    public show(): Promise<FilePickerResult | null> {
        return new Promise((resolve) => {
            this.resolve = resolve;
            document.body.appendChild(this.el.overlay);
            this.updatePathBar();
            this.updateContent();
        });
    }

    private setupContextMenu(): void {
    window.xen.contextMenu.attach(this.el.content, {
        root: [
            {
                title: "New File",
                onClick: async () => {
                    const name = await window.xen.dialog.prompt({
                        title: "New File",
                        placeholder: "Filename",
                    });
                    if (!name) return;
                    const path = `${this.currentPath}/${name}`.replace(/\/+/g, "/");
                    try {
                        await this.fs.write(path, "");
                        await this.updateContent();
                    } catch (err) {
                        console.error("Create file failed:", err);
                    }
                },
            },
            {
                title: "New Folder",
                onClick: async () => {
                    const name = await window.xen.dialog.prompt({
                        title: "New Folder",
                        placeholder: "Folder name",
                    });
                    if (!name) return;
                    const path = `${this.currentPath}/${name}`.replace(/\/+/g, "/");
                    try {
                        await this.fs.mkdir(path);
                        await this.updateContent();
                    } catch (err) {
                        console.error("Create folder failed:", err);
                    }
                },
            },
        ],
    });
}

    public static async pick(options?: FilePickerOptions): Promise<FilePickerResult | null> {
        const picker = new FilePicker(options);
        return picker.show();
    }
}