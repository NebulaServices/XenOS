import JSZip from "jszip";
import mime from "mime";

interface FileEntryInfo {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}

interface FileStat {
    name: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    lastModified: Date;
    mime: string | null;
}

export class XenFS {
    private cwd: string = "/";
    private root: FileSystemDirectoryHandle;
    public mounts: Map<string, FileSystemDirectoryHandle> = new Map();
    private zip: JSZip;

    constructor() {
        this.zip = new JSZip();
    }

    async init(): Promise<void> {
        this.root = await navigator.storage.getDirectory();
    }

    private normalizePath(path: string): string {
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

    private splitPath(path: string): string[] {
        return this.normalizePath(path).split("/").filter(Boolean);
    }

    private async resolveHandle(
        path: string,
        create: boolean = false,
        recursive: boolean = false,
        kind: "file" | "directory" | "any" = "any",
        resolveLink: boolean = true,
    ): Promise<FileSystemHandle> {
        let currentPath = this.normalizePath(path);

        if (resolveLink) {
            const symlinks = window.xen.settings.get("symlinks") || {};

            if (symlinks[currentPath]) {
                currentPath = symlinks[currentPath];
            }
        }

        const parts = this.splitPath(currentPath);
        if (parts.length === 0) return this.root;

        let current: FileSystemDirectoryHandle = this.root;

        for (const [mntPath, mntHandle] of this.mounts.entries()) {
            const normalized = this.normalizePath(mntPath);
            if (currentPath.startsWith(normalized)) {
                const relPath = currentPath.substring(normalized.length);
                const relParts = relPath.split("/").filter(Boolean);
                current = mntHandle;

                for (let i = 0; i < relParts.length - 1; i++) {
                    const part = relParts[i];

                    try {
                        current = await current.getDirectoryHandle(part);
                    } catch (err: any) {
                        if (err.name === "NotFoundError" && recursive) {
                            current = await current.getDirectoryHandle(part, {
                                create: true,
                            });
                        } else {
                            throw err;
                        }
                    }
                }

                const finalPart = relParts[relParts.length - 1];
                if (!finalPart) return current;

                if (kind === "directory") {
                    return await current.getDirectoryHandle(finalPart, {
                        create: create,
                    });
                } else if (kind === "file") {
                    return await current.getFileHandle(finalPart, {
                        create: create,
                    });
                } else {
                    try {
                        return await current.getFileHandle(finalPart, {
                            create: create,
                        });
                    } catch (err) {
                        if (
                            err instanceof DOMException &&
                            err.name === "TypeMismatchError"
                        ) {
                            return await current.getDirectoryHandle(finalPart, {
                                create: create,
                            });
                        }

                        if (create)
                            return await current.getFileHandle(finalPart, {
                                create: true,
                            });
                        throw err;
                    }
                }
            }
        }

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            try {
                current = await current.getDirectoryHandle(part);
            } catch (err: any) {
                if (err.name === "NotFoundError" && recursive) {
                    current = await current.getDirectoryHandle(part, {
                        create: true,
                    });
                } else {
                    throw err;
                }
            }
        }

        const finalPart = parts[parts.length - 1];
        if (!finalPart) return this.root;

        if (kind === "directory") {
            return await current.getDirectoryHandle(finalPart, {
                create: create,
            });
        } else if (kind === "file") {
            return await current.getFileHandle(finalPart, { create: create });
        } else {
            try {
                return await current.getFileHandle(finalPart, {
                    create: create,
                });
            } catch (err) {
                if (
                    err instanceof DOMException &&
                    err.name === "TypeMismatchError"
                ) {
                    return await current.getDirectoryHandle(finalPart, {
                        create: create,
                    });
                }

                if (create)
                    return await current.getFileHandle(finalPart, {
                        create: true,
                    });
                throw err;
            }
        }
    }

    async mkdir(path: string): Promise<void> {
        await this.resolveHandle(path, true, true, "directory");
    }

    async list(path: string, recursive: boolean = false): Promise<FileEntryInfo[]> {
        const dirHandle = (await this.resolveHandle(
            path,
        )) as FileSystemDirectoryHandle;
        const entries: FileEntryInfo[] = [];

        for await (const entry of dirHandle.values()) {
            const info: FileEntryInfo = {
                name: entry.name,
                isFile: entry.kind === "file",
                isDirectory: entry.kind === "directory",
            };

            entries.push(info);

            if (recursive && entry.kind === "directory") {
                const sub = await this.list(
                    this.normalizePath(path + "/" + entry.name),
                    true,
                );

                entries.push(
                    ...sub.map((e) => ({
                        ...e,
                        name: entry.name + "/" + e.name,
                    })),
                );
            }
        }

        return entries;
    }

    async write(path: string, content: Blob | string | ArrayBuffer): Promise<void> {
        const fileHandle = (await this.resolveHandle(
            path,
            true,
            true,
            "file",
        )) as FileSystemFileHandle;
        const writable = await fileHandle.createWritable();

        if (content instanceof Blob) {
            await writable.write(content);
        } else if (typeof content === "string") {
            await writable.write(new Blob([content], { type: "text/plain" }));
        } else {
            await writable.write(new Blob([content]));
        }

        await writable.close();
    }

    async read(
        path: string,
        format: "text" | "arrayBuffer" | "uint8array" | "blob" = "text",
    ): Promise<string | ArrayBuffer | Uint8Array | Blob> {
        const fileHandle = (await this.resolveHandle(
            path,
            false,
            false,
            "file",
        )) as FileSystemFileHandle;

        const file = await fileHandle.getFile();

        switch (format) {
            case "text":
                return await file.text();
            case "arrayBuffer":
                return await file.arrayBuffer();
            case "uint8array":
                return new Uint8Array(await file.arrayBuffer());
            case "blob":
            default:
                return file;
        }
    }

    async rm(path: string): Promise<void> {
        const symlinks = window.xen.settings.get("symlinks") || {};

        if (symlinks[this.normalizePath(path)]) {
            this.unlink(path);
            return;
        }

        const parts = this.splitPath(path);
        const name = parts.pop();

        if (!name) {
            if (this.normalizePath(path) === "/") {
                for await (const entry of this.root.values()) {
                    await this.root.removeEntry(entry.name, { recursive: true });
                }

                return;
            }

            throw new Error("Cannot remove root directory with rm command");
        }

        const parentPath = "/" + parts.join("/");
        const dirHandle = (await this.resolveHandle(
            parentPath,
        )) as FileSystemDirectoryHandle;

        await dirHandle.removeEntry(name, { recursive: true });
    }

    async exists(path: string): Promise<boolean> {
        try {
            await this.resolveHandle(path);
            return true;
        } catch {
            return false;
        }
    }

    async pwd(): Promise<string> {
        return this.cwd;
    }

    async cd(path: string): Promise<void> {
        const newPath = this.normalizePath(path);
        const handle = await this.resolveHandle(newPath);

        if (handle.kind !== "directory")
            throw new Error(`${newPath} is not a directory`);
        this.cwd = newPath;
    }

    async fetch(url: string, path: string): Promise<void> {
        const res = await window.xen.net.fetch(url);
        if (!res.ok)
            throw new Error(`Fetch failed: ${res.statusText} (${res.status})`);

        const blob = await res.blob();
        await this.write(path, blob);
    }

    async mount(path: string): Promise<void> {
        const handle = await window.showDirectoryPicker();
        this.mounts.set(this.normalizePath(path), handle);
    }

    async unmount(path: string): Promise<void> {
        this.mounts.delete(this.normalizePath(path));
    }

    private async addDirContents(
        dirHandle: FileSystemDirectoryHandle,
        currentPath: string,
    ) {
        for await (const entry of dirHandle.values()) {
            const entryPath = this.normalizePath(`${currentPath}/${entry.name}`);

            if (entry.kind === "file") {
                const file = await (entry as FileSystemFileHandle).getFile();
                await this.write(entryPath, file);
            } else if (entry.kind === "directory") {
                await this.mkdir(entryPath);
                await this.addDirContents(
                    entry as FileSystemDirectoryHandle,
                    entryPath,
                );
            }
        }
    }

    async upload(type: "file" | "directory", path: string): Promise<void> {
        if (type === "file") {
            const [handle] = await window.showOpenFilePicker();
            const file = await handle.getFile();

            await this.write(path, file);
        } else if (type === "directory") {
            const handle = await window.showDirectoryPicker();

            await this.mkdir(path);
            await this.addDirContents(handle, path);
        } else {
            throw new Error("Invalid type specified for upload");
        }
    }

    private async dirToZip(
        handle: FileSystemDirectoryHandle,
        curr: string,
    ): Promise<void> {
        for await (const entry of handle.values()) {
            const path = curr ? `${curr}/${entry.name}` : entry.name;
            if (entry.kind === "file") {
                const file = await (entry as FileSystemFileHandle).getFile();
                this.zip.file(path, file);
            } else if (entry.kind === "directory") {
                await this.dirToZip(entry as FileSystemDirectoryHandle, path);
            }
        }
    }

    async download(path: string): Promise<void> {
        const handle = await this.resolveHandle(path);
        const fileName = handle.name;

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            const a = document.createElement("a");

            a.href = URL.createObjectURL(file);
            a.download = file.name;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else if (handle.kind === "directory") {
            await this.dirToZip(handle as FileSystemDirectoryHandle, fileName);

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

    async copy(src: string, dest: string): Promise<void> {
        const handle = await this.resolveHandle(src);
        const normalized = this.normalizePath(dest);

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            await this.write(normalized, file);
        } else if (handle.kind === "directory") {
            await this.mkdir(normalized);
            const entries = await this.list(this.normalizePath(src), true);

            for (const entry of entries) {
                const fullSrc = this.normalizePath(`${src}/${entry.name}`);
                const fullDest = this.normalizePath(`${dest}/${entry.name}`);

                if (entry.isFile) {
                    const file = await (
                        (await this.resolveHandle(
                            fullSrc,
                        )) as FileSystemFileHandle
                    ).getFile();
                    await this.write(fullDest, file);
                } else if (entry.isDirectory) {
                    await this.mkdir(fullDest);
                }
            }
        }
    }

    async move(src: string, dest: string): Promise<void> {
        await this.copy(src, dest);
        await this.rm(src);
    }

    async stat(path: string): Promise<FileStat> {
        const handle = await this.resolveHandle(path);

        const stat: FileStat = {
            name: handle.name,
            size: 0,
            isDirectory: handle.kind === "directory",
            isFile: handle.kind === "file",
            lastModified: new Date(),
            mime: mime.getType(path),
        };

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();

            stat.size = file.size;
            stat.lastModified = new Date(file.lastModified);
        }

        return stat;
    }

    async compress(path: string, dest: string): Promise<void> {
        const handle = await this.resolveHandle(path);

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            this.zip.file(handle.name, file);
        } else if (handle.kind === "directory") {
            await this.dirToZip(handle as FileSystemDirectoryHandle, "");
        }

        const content = await this.zip.generateAsync({ type: "blob" });
        await this.write(dest, content);
    }

    async decompress(path: string, dest: string): Promise<void> {
        const fileHandle = (await this.resolveHandle(
            path,
            false,
            false,
            "file",
        )) as FileSystemFileHandle;

        const file = await fileHandle.getFile();
        const zip = await this.zip.loadAsync(file);

        await this.mkdir(dest);

        for (const relPath in zip.files) {
            const entry = zip.files[relPath];
            const fullDest = this.normalizePath(`${dest}/${relPath}`);

            if (!entry.dir) {
                const content = await entry.async("blob");
                await this.write(fullDest, content);
            } else {
                await this.mkdir(fullDest);
            }
        }
    }

    async link(src: string, dest: string): Promise<void> {
        const nmSrc = this.normalizePath(src);
        const nmDest = this.normalizePath(dest);
        const symlinks = window.xen.settings.get("symlinks") || {};

        symlinks[nmDest] = nmSrc;
        window.xen.settings.set("symlinks", symlinks);
    }

    async unlink(path: string): Promise<void> {
        const nmPath = this.normalizePath(path);
        const symlinks = window.xen.settings.get("symlinks") || {};

        delete symlinks[nmPath];
        window.xen.settings.set("symlinks", symlinks);
    }

    async readlink(path: string): Promise<string> {
        const nmPath = this.normalizePath(path);
        const symlinks = window.xen.settings.get("symlinks") || {};
        const target = symlinks[nmPath];

        if (!target) throw new Error(`${path} is not a symbolic link`);
        return target;
    }

    async wipe(): Promise<void> {
        for await (const entry of this.root.values()) {
            await this.root.removeEntry(entry.name, { recursive: true });
        }

        this.cwd = "/";
    }

    async export(): Promise<void> {
        await this.dirToZip(this.root, "");

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

        await this.wipe();

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
}