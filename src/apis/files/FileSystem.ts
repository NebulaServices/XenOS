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
    abstract exists(path: string): Promise<boolean>;
    abstract cd(path: string): Promise<void>;

    pwd(): string { 
        return this.cwd; 
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
        console.log(path);

        const mime = await import('mime');
        const xen = window.xen;
        const blob = await this.read(path, 'blob');
        const url = URL.createObjectURL(blob as Blob);
        const mt = mime.default?.getType(path) || 'application/octet-stream';

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

    // Optional methods
    async init?(): Promise<void>;
    async fetch?(url: string, path: string): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async mount?(path: string): Promise<void>; // Only for XenFS (OPFS-based, requires file handler)
    async unmount?(path: string): Promise<void>; // Only for XenFS (OPFS-based, requires file handler)
    async upload?(type: "file" | "directory", path: string): Promise<void>;
    async download?(path: string): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async stat?(path: string): Promise<FileStat>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async compress?(path: string, dest: string): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async decompress?(path: string, dest: string): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async link?(src: string, dest: string): Promise<void>;
    async unlink?(path: string): Promise<void>;
    async readlink?(path: string): Promise<string>;
    async wipe?(): Promise<void>; // This is only for XenFS (the RootFS) unless I decide to make it work with other FSs
    async export?(): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
    async import?(): Promise<void>; // TODO: This method does not need to be implemented per-FS as it's pretty repetitive, it should be implemented for them
}
