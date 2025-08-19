import JSZip from "jszip";
import mime from "mime";

export interface FileEntryInfo {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}

export interface FileStat {
    name: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    lastModified: Date;
    mime: string | null;
}

export abstract class FileSystem {
    protected cwd: string = "/";
    protected zip: JSZip;

    constructor() {
        this.zip = new JSZip();
    }

    public normalizePath(path: string, cwd?: string): string {
        if (cwd) this.cwd = cwd;
        if (!path) return this.cwd;
        if (path.startsWith("~")) path = "/usr" + path.slice(1);
        if (!path.startsWith("/")) path = this.cwd + "/" + path;

        const parts = path.split("/").filter(Boolean);
        const stack: string[] = [];

        for (const part of parts) {
            if (part === "." || part === "") continue;
            if (part === "..") {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }

        let normalized = "/" + stack.join("/");
        if (normalized === "//") normalized = "/";

        return normalized;
    }

    // Required methods
    abstract mkdir(path: string): Promise<void>;
    abstract list(path: string, recursive?: boolean): Promise<FileEntryInfo[]>;
    abstract rm(path: string): Promise<void>;
    abstract write(path: string, content: Blob | string | ArrayBuffer): Promise<void>;
    abstract read(path: string, format?: "text" | "arrayBuffer" | "uint8array" | "blob"): Promise<string | ArrayBuffer | Uint8Array | Blob>;
    abstract cd(path: string): Promise<void>;

    pwd(): string {
        return this.cwd;
    }

    async exists(path: string): Promise<boolean> {
        try {
            await this.stat(path);
            return true;
        } catch {
            return false;
        }
    }

    async copy(src: string, dest: string): Promise<void> {
        const srcNorm = this.normalizePath(src);
        const destNorm = this.normalizePath(dest);

        if (!(await this.exists(srcNorm))) {
            throw new Error(`Source path ${src} does not exist`);
        }

        const parent = srcNorm.substring(0, srcNorm.lastIndexOf('/')) || '/';
        const srcName = srcNorm.substring(srcNorm.lastIndexOf('/') + 1);
        let entries: FileEntryInfo[] = [];

        try {
            entries = await this.list(parent);
        } catch (error) {
            throw new Error(`Failed to access source path ${src}: ${error}`);
        }

        const srcEntry = entries.find(entry => entry.name === srcName);

        if (!srcEntry) {
            throw new Error(`Source path ${src} not found`);
        }

        if (srcEntry.isFile) {
            const content = await this.read(srcNorm, "blob");
            await this.write(destNorm, content as Blob);
        } else if (srcEntry.isDirectory) {
            await this.copyRecursive(srcNorm, destNorm);
        }
    }

    private async copyRecursive(src: string, dest: string): Promise<void> {
        await this.mkdir(dest);
        const entries = await this.list(src);

        for (const entry of entries) {
            const srcPath = this.normalizePath(`${src}/${entry.name}`);
            const destPath = this.normalizePath(`${dest}/${entry.name}`);

            if (entry.isFile) {
                const content = await this.read(srcPath, "blob");
                await this.write(destPath, content as Blob);
            } else if (entry.isDirectory) {
                await this.copyRecursive(srcPath, destPath);
            }
        }
    }

    async move(src: string, dest: string): Promise<void> {
        await this.copy(src, dest);
        await this.rm(src);
    }

    async open(path: string, callback?: (path: string, url: string, mime: string) => void): Promise<void> {
        const xen = window.xen;
        const blob = await this.read(path, 'blob');
        const url = URL.createObjectURL(blob as Blob);
        const mt = mime.getType(path) || 'application/octet-stream';

        if (callback) {
            callback(path, url, mt);
        }

        if (
            mt.startsWith('text/') ||
            mt === 'application/json'
        ) {
            xen.packages.open('org.nebulaservices.texteditor', {
                file: path
            });
        } else if (
            mt.startsWith('image/')
        ) {
            xen.wm.create({
                title: 'Image Viewer',
                icon: '/assets/logo.svg',
                content: `
                            <img 
                                width="100%" 
                                height="100%" 
                                src="${url}"
                                style="object-fit: contain;"
                                onload="this.style.opacity = '1';"
                                style="opacity: 0; transition: opacity 0.3s;"
                            >`
            });
        } else if (
            mt.startsWith('video/')
        ) {
            xen.wm.create({
                title: 'Video Player',
                icon: '/assets/logo.svg',
                content: `
                            <video
                                width="100%"
                                height="100%"
                                controls
                                style="object-fit: contain;"
                            >
                                <source src="${url}" type="${mt}">
                                Your browser does not support the video tag.
                            </video>
                        `
            });
        } else if (
            mt.startsWith('audio/')
        ) {
            xen.wm.create({
                title: 'Music Player',
                icon: '/assets/logo.svg',
                content: `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px;">
                                <div style="margin-bottom: 20px; text-align: center;">
                                    <h3 style="margin: 0; color: #333;">${path.split('/').pop()}</h3>
                                </div>
                                <audio 
                                    controls 
                                    style="width: 100%; max-width: 400px;"
                                    preload="metadata"
                                >
                                    <source src="${url}" type="${mt}">
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        `
            });
        } else {
            xen.notifications.spawn({
                title: 'XenOS',
                description: 'This file type is unsupported :(',
                icon: '/assets/logo.svg',
                timeout: 2500
            });
        }
    }

    async fetch(url: string, path: string): Promise<void> {
        const res = await window.xen.net.fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText} (${res.status})`);

        const blob = await res.blob();
        await this.write(path, blob);
    }

    async upload(type: "file" | "directory", path: string): Promise<void> {
        if (type === "file") {
            const [handle] = await window.showOpenFilePicker({
                multiple: false,
                excludeAcceptAllOption: false,
            });

            const file = await handle.getFile();
            const targetPath = this.normalizePath(`${path}/${file.name}`);
    
            await this.write(targetPath, file);
        } else if (type === "directory") {
            const dirHandle = await window.showDirectoryPicker();
            const targetPath = this.normalizePath(`${path}/${dirHandle.name}`);
            
            await this.mkdir(targetPath);
            await this.uploadToDir(dirHandle, targetPath);
        } else {
            throw new Error("Invalid upload type, must be 'file' or 'directory'");
        }
    }

    private async uploadToDir(dirHandle: FileSystemDirectoryHandle, targetPath: string): Promise<void> {
        for await (const entry of dirHandle.values()) {
            const target = this.normalizePath(`${targetPath}/${entry.name}`);
            
            if (entry.kind === "file") {
                const file = await (entry as FileSystemFileHandle).getFile();
                await this.write(target, file);
            } else if (entry.kind === "directory") {
                await this.mkdir(target);
                await this.uploadToDir(entry as FileSystemDirectoryHandle, target);
            }
        }
    }

    async stat(path: string): Promise<FileStat> {
        const normalized = this.normalizePath(path);

        if (!(await this.exists(normalized))) {
            throw new Error(`Path does not exist: ${path}`);
        }

        const parent = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
        const fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        const entries = await this.list(parent);
        const entry = entries.find(e => e.name === fileName);

        if (!entry) {
            throw new Error(`Entry not found: ${path}`);
        }

        const stat: FileStat = {
            name: fileName,
            size: 0,
            isDirectory: entry.isDirectory,
            isFile: entry.isFile,
            lastModified: new Date(),
            mime: entry.isFile ? mime.getType(path) : null,
        };

        if (entry.isFile) {
            try {
                const content = await this.read(normalized, "blob") as Blob;
                stat.size = content.size;
            } catch { }
        }

        return stat;
    }

    private async dirToZip(dirPath: string, currentPath: string = ""): Promise<void> {
        const entries = await this.list(dirPath);

        for (const entry of entries) {
            const entryPath = this.normalizePath(`${dirPath}/${entry.name}`);
            const zipPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.isFile) {
                const content = await this.read(entryPath, "blob") as Blob;
                this.zip.file(zipPath, content);
            } else if (entry.isDirectory) {
                await this.dirToZip(entryPath, zipPath);
            }
        }
    }

    async download(path: string): Promise<void> {
        const normalized = this.normalizePath(path);

        if (!(await this.exists(normalized))) {
            throw new Error(`Path does not exist: ${path}`);
        }

        const parent = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
        const fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        const entries = await this.list(parent);
        const entry = entries.find(e => e.name === fileName);

        if (!entry) {
            throw new Error(`Entry not found: ${path}`);
        }

        if (entry.isFile) {
            const content = await this.read(normalized, "blob") as Blob;
            const a = document.createElement("a");

            a.href = URL.createObjectURL(content);
            a.download = fileName;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else if (entry.isDirectory) {
            this.zip = new JSZip();
            await this.dirToZip(normalized, fileName);

            const content = await this.zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");

            a.href = URL.createObjectURL(content);
            a.download = `${fileName}.zip`;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else {
            throw new Error(`Cannot download ${path}`);
        }
    }

    async compress(path: string, dest: string): Promise<void> {
        const normalized = this.normalizePath(path);
        const destNorm = this.normalizePath(dest);

        if (!(await this.exists(normalized))) {
            throw new Error(`Source path does not exist: ${path}`);
        }

        const parent = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
        const fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        const entries = await this.list(parent);
        const entry = entries.find(e => e.name === fileName);

        if (!entry) {
            throw new Error(`Entry not found: ${path}`);
        }

        this.zip = new JSZip();

        if (entry.isFile) {
            const content = await this.read(normalized, "blob") as Blob;
            this.zip.file(fileName, content);
        } else if (entry.isDirectory) {
            await this.dirToZip(normalized, "");
        }

        const content = await this.zip.generateAsync({ type: "blob" });
        await this.write(destNorm, content);
    }

    async decompress(path: string, dest: string): Promise<void> {
        const normalized = this.normalizePath(path);
        const destNorm = this.normalizePath(dest);

        if (!(await this.exists(normalized))) {
            throw new Error(`Archive does not exist: ${path}`);
        }

        const zipContent = await this.read(normalized, "blob") as Blob;
        const zip = new JSZip();
        const loaded = await zip.loadAsync(zipContent);

        await this.mkdir(destNorm);

        for (const relPath in loaded.files) {
            const entry = loaded.files[relPath];
            const fullDest = this.normalizePath(`${destNorm}/${relPath}`);

            if (!entry.dir) {
                const content = await entry.async("blob");
                await this.write(fullDest, content);
            } else {
                await this.mkdir(fullDest);
            }
        }
    }

    async export(): Promise<void> {
        this.zip = new JSZip();
        await this.dirToZip("/", "");

        const content = await this.zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");

        a.href = URL.createObjectURL(content);
        a.download = "filesystem.zip";

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    async import(): Promise<void> {
        const [handle] = await window.showOpenFilePicker({
            types: [
                {
                    description: "ZIP files",
                    accept: { "application/zip": [".zip"] },
                },
            ],
        });

        const file = await handle.getFile();
        const zip = new JSZip();
        const loaded = await zip.loadAsync(file);

        if (this.wipe) {
            await this.wipe();
        }

        for (const relPath in loaded.files) {
            const entry = loaded.files[relPath];
            const fullPath = this.normalizePath(`/${relPath}`);

            if (!entry.dir) {
                const content = await entry.async("blob");
                await this.write(fullPath, content);
            } else {
                await this.mkdir(fullPath);
            }
        }
    }

    async init?(): Promise<void>;
    async mount?(path: string): Promise<void>;
    async unmount?(path: string): Promise<void>;
    async link?(src: string, dest: string): Promise<void>;
    async unlink?(path: string): Promise<void>;
    async readlink?(path: string): Promise<string>;
    async wipe?(): Promise<void>;
}
