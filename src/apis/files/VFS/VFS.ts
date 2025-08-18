import { FileSystem, FileEntryInfo, FileStat } from "../FileSystem";

export interface VFSMount {
    path: string;
    fs: FileSystem;
}

export class VFS extends FileSystem {
    private mounts: Map<string, FileSystem> = new Map();
    private rootFS: FileSystem;

    constructor(rootFS: FileSystem) {
        super();

        this.rootFS = rootFS;
        this.mounts.set("/", rootFS);
    }

    async mountFS(path: string, fs: FileSystem): Promise<void> {
        const normalized = this.normalizePath(path);

        if (normalized !== "/") {
            try {
                await this.rootFS.mkdir(normalized);
            } catch { }
        }

        this.mounts.set(normalized, fs);
    }

    async unmountFS(path: string): Promise<void> {
        const normalized = this.normalizePath(path);

        if (normalized === "/") {
            throw new Error("Cannot unmount RootFS");
        }

        this.mounts.delete(normalized);
    }

    private resolveMount(path: string): { fs: FileSystem; relativePath: string } {
        const normalized = this.normalizePath(path);
        
        let bestMatch = "/";
        let bestLength = 1;

        for (const mounts of this.mounts.keys()) {
            if (normalized.startsWith(mounts) && mounts.length > bestLength) {
                bestMatch = mounts;
                bestLength = mounts.length;
            }
        }

        const filesystem = this.mounts.get(bestMatch)!;
        let relativePath: string;

        if (bestMatch === "/") {
            relativePath = normalized;
        } else {
            relativePath = normalized.substring(bestMatch.length);

            if (!relativePath.startsWith("/")) {
                relativePath = "/" + relativePath;
            }
        }

        return { fs: filesystem, relativePath };
    }

    getMounts(): VFSMount[] {
        const mounts: VFSMount[] = [];

        for (const [path, filesystem] of this.mounts.entries()) {
            mounts.push({
                path,
                fs: filesystem
            });
        }

        return mounts;
    }

    async mkdir(path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);
        return fs.mkdir(relativePath);
    }

    async list(path: string, recursive?: boolean): Promise<FileEntryInfo[]> {
        const { fs, relativePath } = this.resolveMount(path);
        const entries = await fs.list(relativePath, recursive);

        if (path === "/" || this.normalizePath(path) === "/") {
            const mountss = Array.from(this.mounts.keys())
                .filter(mp => mp !== "/" && !mp.includes("/", 1))
                .map(mp => ({
                    name: mp.substring(1),
                    isFile: false,
                    isDirectory: true
                }));

            const existingNames = new Set(entries.map(e => e.name));

            for (const mounts of mountss) {
                if (!existingNames.has(mounts.name)) {
                    entries.push(mounts);
                }
            }
        }

        return entries;
    }

    async rm(path: string): Promise<void> {
        const normalized = this.normalizePath(path);

        if (this.mounts.has(normalized) && normalized !== "/") {
            throw new Error(`Cannot remove directory ${path} as it is a mount point, you must unmount it first`);
        }

        const { fs, relativePath } = this.resolveMount(path);
        return fs.rm(relativePath);
    }

    async write(path: string, content: Blob | string | ArrayBuffer): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);
        return fs.write(relativePath, content);
    }

    async read(path: string, format?: "text" | "arrayBuffer" | "uint8array" | "blob"): Promise<string | ArrayBuffer | Uint8Array | Blob> {
        const { fs, relativePath } = this.resolveMount(path);
        return fs.read(relativePath, format);
    }

    async exists(path: string): Promise<boolean> {
        const normalized = this.normalizePath(path);
        
        if (this.mounts.has(normalized)) {
            return true;
        }

        const { fs, relativePath } = this.resolveMount(path);
        return fs.exists(relativePath);
    }

    async pwd(): Promise<string> {
        return this.cwd;
    }

    async cd(path: string): Promise<void> {
        const normalized = this.normalizePath(path);

        if (!(await this.exists(normalized))) {
            throw new Error(`${path} not found`);
        }

        if (this.mounts.has(normalized)) {
            this.cwd = normalized;
            return;
        }

        try {
            this.cwd = normalized;
        } catch (error) {
            throw new Error(`${path} is not a directory`);
        }
    }

    async copy(src: string, dest: string): Promise<void> {
        const srcResolve = this.resolveMount(src);
        const destResolve = this.resolveMount(dest);

        if (srcResolve.fs === destResolve.fs) {
            return srcResolve.fs.copy(srcResolve.relativePath, destResolve.relativePath);
        }

        const content = await srcResolve.fs.read(srcResolve.relativePath, "blob") as Blob;
        return destResolve.fs.write(destResolve.relativePath, content);
    }

    async move(src: string, dest: string): Promise<void> {
        const srcResolve = this.resolveMount(src);
        const destResolve = this.resolveMount(dest);

        if (srcResolve.fs === destResolve.fs) {
            return srcResolve.fs.move(srcResolve.relativePath, destResolve.relativePath);
        }

        await this.copy(src, dest);
        await this.rm(src);
    }

    async init?(): Promise<void> {
        if (this.rootFS.init) {
            await this.rootFS.init();
        }
    }

    async mount?(path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.mount) {
            return fs.mount(relativePath);
        }

        throw new Error("Mount not supported by target FS");
    }

    async unmount?(path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.unmount) {
            return fs.unmount(relativePath);
        }

        throw new Error("Unmount not supported by target FS");
    }

    async fetch?(url: string, path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.fetch) {
            return fs.fetch(url, relativePath);
        }

        throw new Error("Fetch not supported by target FS");
    }

    async upload?(type: "file" | "directory", path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.upload) {
            return fs.upload(type, relativePath);
        }

        throw new Error("Upload not supported by target FS");
    }

    async download?(path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.download) {
            return fs.download(relativePath);
        }

        throw new Error("Download not supported by target FS");
    }

    async stat?(path: string): Promise<FileStat> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.stat) {
            return fs.stat(relativePath);
        }

        throw new Error("Stat not supported by target FS");
    }

    async compress?(path: string, dest: string): Promise<void> {
        const srcResolve = this.resolveMount(path);
        const destResolve = this.resolveMount(dest);

        if (srcResolve.fs === destResolve.fs && srcResolve.fs.compress) {
            return srcResolve.fs.compress(srcResolve.relativePath, destResolve.relativePath);
        }

        throw new Error("Compress not supported or paths are on different filesystems");
    }

    async decompress?(path: string, dest: string): Promise<void> {
        const srcResolve = this.resolveMount(path);
        const destResolve = this.resolveMount(dest);

        if (srcResolve.fs === destResolve.fs && srcResolve.fs.decompress) {
            return srcResolve.fs.decompress(srcResolve.relativePath, destResolve.relativePath);
        }

        throw new Error("Decompress not supported or paths are on different filesystems");
    }

    async link?(src: string, dest: string): Promise<void> {
        const srcResolve = this.resolveMount(src);
        const destResolve = this.resolveMount(dest);

        if (srcResolve.fs === destResolve.fs && srcResolve.fs.link) {
            return srcResolve.fs.link(srcResolve.relativePath, destResolve.relativePath);
        }

        throw new Error("Link not supported or paths are on different filesystems");
    }

    async unlink?(path: string): Promise<void> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.unlink) {
            return fs.unlink(relativePath);
        }

        throw new Error("Unlink not supported by target FS");
    }

    async readlink?(path: string): Promise<string> {
        const { fs, relativePath } = this.resolveMount(path);

        if (fs.readlink) {
            return fs.readlink(relativePath);
        }

        throw new Error("Readlink not supported by target FS");
    }

    async wipe?(): Promise<void> {
        for (const [_, fs] of this.mounts.entries()) {
            if (fs.wipe) {
                await fs.wipe();
            }
        }

        this.cwd = "/";
    }

    async export?(): Promise<void> {
        if (this.rootFS.export) {
            return this.rootFS.export();
        }
    
        throw new Error("Export not supported by RootFS");
    }

    async import?(): Promise<void> {
        if (this.rootFS.import) {
            return this.rootFS.import();
        }

        throw new Error("Import not supported by RootFS");
    }
}
