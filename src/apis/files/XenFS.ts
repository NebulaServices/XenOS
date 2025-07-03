/*
    TODO:
    - Fix AI slop
    - Allow for array arguments (Ex: xen.fs.rmdir(['/test','/test2']))
    - Provide better outputs for this.list(path, true);
    - Implement links
    - Write a unit test
    - Allow for less-verbose paths (Ex: xen.fs.fetch('https://example.com/test.txt', '/'))
    - Provide an abstract FileSystem class
    - Implement chown and chmod
    - Implement user support and ~ swapping
    - v86 sync (future)
    - Make a FS resolver
*/

export class XenFS {
    private cwd: string = "/";
    private root: FileSystemDirectoryHandle;
    private mounts: Map<string, FileSystemDirectoryHandle> = new Map();
    private zip: any;

    constructor() {
        this.zip = new window.JSZip();
    }

    async init(): Promise<void> {
        this.root = await navigator.storage.getDirectory();
    }

    private normalizePath(path: string): string {
        if (!path) return this.cwd;
        if (path.startsWith("~")) path = "/root" + path.slice(1);
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
    ): Promise<FileSystemHandle> {
        const parts = this.splitPath(path);
        if (parts.length === 0) return this.root;

        let current: FileSystemDirectoryHandle = this.root;

        for (const [mntPath, mntHandle] of this.mounts.entries()) {
            const normalizedMntPath = this.normalizePath(mntPath);
            if (this.normalizePath(path).startsWith(normalizedMntPath)) {
                const relPath = this.normalizePath(path).substring(
                    normalizedMntPath.length,
                );

                const relParts = relPath.split("/").filter(Boolean);
                current = mntHandle;

                for (let i = 0; i < relParts.length - 1; i++) {
                    const part = relParts[i];

                    try {
                        current = await current.getDirectoryHandle(part);
                    } catch (e: any) {
                        if (e.name === "NotFoundError" && recursive) {
                            current = await current.getDirectoryHandle(part, {
                                create: true,
                            });
                        } else {
                            throw e;
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
                    return await current.getFileHandle(finalPart, { create: create });
                } else {
                    try {
                        return await current.getFileHandle(finalPart, { create: create });
                    } catch (e) {
                        if (e instanceof DOMException && e.name === "TypeMismatchError") {
                            return await current.getDirectoryHandle(finalPart, {
                                create: create,
                            });
                        }

                        if (create) {
                            return await current.getFileHandle(finalPart, { create: true });
                        }

                        throw e;
                    }
                }
            }
        }

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            try {
                current = await current.getDirectoryHandle(part);
            } catch (e: any) {
                if (e.name === "NotFoundError" && recursive) {
                    current = await current.getDirectoryHandle(part, { create: true });
                } else {
                    throw e;
                }
            }
        }

        const finalPart = parts[parts.length - 1];
        if (!finalPart) return this.root;

        if (kind === "directory") {
            return await current.getDirectoryHandle(finalPart, { create: create });
        } else if (kind === "file") {
            return await current.getFileHandle(finalPart, { create: create });
        } else {
            try {
                return await current.getFileHandle(finalPart, { create: create });
            } catch (e) {
                if (e instanceof DOMException && e.name === "TypeMismatchError") {
                    return await current.getDirectoryHandle(finalPart, {
                        create: create,
                    });
                }

                if (create) {
                    return await current.getFileHandle(finalPart, { create: true });
                }

                throw e;
            }
        }
    }

    async mkdir(path: string): Promise<void> {
        await this.resolveHandle(path, true, true, "directory");
    }

    async list(
        path: string,
        recursive: boolean = false,
    ): Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]> {
        const dirHandle = (await this.resolveHandle(
            path,
        )) as FileSystemDirectoryHandle;
        const entries: { name: string; isFile: boolean; isDirectory: boolean }[] =
            [];

        for await (const entry of dirHandle.values()) {
            const info = {
                name: entry.name,
                isFile: entry.kind === "file",
                isDirectory: entry.kind === "directory",
            };

            entries.push(info);

            if (recursive && entry.kind === "directory") {
                const subEntries = await this.list(
                    this.normalizePath(path + "/" + entry.name),
                    true,
                );

                entries.push(
                    ...subEntries.map((e) => ({
                        ...e,
                        name: entry.name + "/" + e.name,
                    })),
                );
            }
        }

        return entries;
    }

    async write(path: string, content: any): Promise<void> {
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

    async read(path: string): Promise<string> {
        const fileHandle = (await this.resolveHandle(
            path,
            false,
            false,
            "file",
        )) as FileSystemFileHandle;

        const file = await fileHandle.getFile();
        return await file.text();
    }

    async rm(path: string): Promise<void> {
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
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText} (${res.status})`);

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

    async upload(type: "file" | "directory", path: string): Promise<void> {
        if (type === "file") {
            const [handle] = await window.showOpenFilePicker();
            const file = await handle.getFile();

            await this.write(path, file);
        } else if (type === "directory") {
            const handle = await window.showDirectoryPicker();
            await this.mkdir(path);

            const addDirectoryContents = async (
                dirHandle: FileSystemDirectoryHandle,
                currentPath: string,
            ) => {
                for await (const entry of dirHandle.values()) {
                    const entryPath = this.normalizePath(`${currentPath}/${entry.name}`);

                    if (entry.kind === "file") {
                        const file = await (entry as FileSystemFileHandle).getFile();
                        await this.write(entryPath, file);
                    } else if (entry.kind === "directory") {
                        await this.mkdir(entryPath);
                        await addDirectoryContents(
                            entry as FileSystemDirectoryHandle,
                            entryPath,
                        );
                    }
                }
            };

            await addDirectoryContents(handle, path);
        } else {
            throw new Error('Invalid type specified for upload. Use "file" or "directory".');
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

            const addDirectoryToZip = async (
                dirHandle: FileSystemDirectoryHandle,
                currentPathInZip: string,
            ) => {
                for await (const entry of dirHandle.values()) {
                    const entryZipPath = currentPathInZip
                        ? `${currentPathInZip}/${entry.name}`
                        : entry.name;
                    if (entry.kind === "file") {
                        const file = await (entry as FileSystemFileHandle).getFile();
                        this.zip.file(entryZipPath, file);
                    } else if (entry.kind === "directory") {
                        await addDirectoryToZip(
                            entry as FileSystemDirectoryHandle,
                            entryZipPath,
                        );
                    }
                }
            };

            await addDirectoryToZip(handle as FileSystemDirectoryHandle, fileName);

            const content = await this.zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");

            a.href = URL.createObjectURL(content);
            a.download = `${fileName}.zip`;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else {
            throw new Error(`Cannot download ${path}: Not a file or directory`);
        }
    }

    async copy(src: string, dest: string): Promise<void> {
        const srcHandle = await this.resolveHandle(src);
        const destPathNormalized = this.normalizePath(dest);

        if (srcHandle.kind === "file") {
            const file = await (srcHandle as FileSystemFileHandle).getFile();
            await this.write(destPathNormalized, file);
        } else if (srcHandle.kind === "directory") {
            await this.mkdir(destPathNormalized);
            const entries = await this.list(this.normalizePath(src), true);

            for (const entry of entries) {
                const fullSrcPath = this.normalizePath(`${src}/${entry.name}`);
                const fullDestPath = this.normalizePath(`${dest}/${entry.name}`);

                if (entry.isFile) {
                    const file = await (
                        (await this.resolveHandle(fullSrcPath)) as FileSystemFileHandle
                    ).getFile();
                    await this.write(fullDestPath, file);
                } else if (entry.isDirectory) {
                    await this.mkdir(fullDestPath);
                }
            }
        }
    }

    async move(src: string, dest: string): Promise<void> {
        await this.copy(src, dest);
        await this.rm(src);
    }

    async stat(path: string): Promise<{
        name: string;
        size: number;
        isDirectory: boolean;
        isFile: boolean;
        createdAt: Date;
        lastModified: Date;
        lastAccessed: Date;
    }> {
        const handle = await this.resolveHandle(path);

        let stat = {
            name: handle.name,
            size: 0,
            isDirectory: handle.kind === "directory",
            isFile: handle.kind === "file",
            createdAt: new Date(),
            lastModified: new Date(),
            lastAccessed: new Date(),
        };

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            stat.size = file.size;
            stat.lastModified = new Date(file.lastModified);
        }

        return stat;
    }

    async export(fileName: string = "filesystem.zip"): Promise<void> {
        const addDirectoryToZip = async (
            dirHandle: FileSystemDirectoryHandle,
            currentPath: string,
        ) => {
            for await (const entry of dirHandle.values()) {
                const fullPath = this.normalizePath(`${currentPath}/${entry.name}`);

                if (entry.kind === "file") {
                    const file = await (entry as FileSystemFileHandle).getFile();
                    this.zip.file(fullPath.substring(1), file);
                } else if (entry.kind === "directory") {
                    await addDirectoryToZip(entry as FileSystemDirectoryHandle, fullPath);
                }
            }
        };

        await addDirectoryToZip(this.root, "/");
        const content = await this.zip.generateAsync({ type: "blob" });

        const a = document.createElement("a");

        a.href = URL.createObjectURL(content);
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    async import(): Promise<void> {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: "ZIP Files", accept: { "application/zip": [".zip"] } }],
        });

        const file = await fileHandle.getFile();
        const zip = await this.zip.loadAsync(file);

        for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];
    
            if (!zipEntry.dir) {
                const fullPath = this.normalizePath(`/${relativePath}`);
                const content = await zipEntry.async("blob");

                await this.write(fullPath, content);
            } else {
                const fullPath = this.normalizePath(`/${relativePath}`);
                await this.mkdir(fullPath);
            }
        }
    }

    async purge(): Promise<void> {
        for await (const entry of this.root.values()) {
            await this.root.removeEntry(entry.name, { recursive: true });
        }

        this.cwd = "/";
    }

    async compress(path: string, dest: string): Promise<void> {
        const handle = await this.resolveHandle(path);

        if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            this.zip.file(handle.name, file);
        } else if (handle.kind === "directory") {
            const addDirectoryToZip = async (
                dirHandle: FileSystemDirectoryHandle,
                currentZipPath: string,
            ) => {
                for await (const entry of dirHandle.values()) {
                    const entryZipPath = currentZipPath
                        ? `${currentZipPath}/${entry.name}`
                        : entry.name;
                    if (entry.kind === "file") {
                        const file = await (entry as FileSystemFileHandle).getFile();
                        this.zip.file(entryZipPath, file);
                    } else if (entry.kind === "directory") {
                        await addDirectoryToZip(
                            entry as FileSystemDirectoryHandle,
                            entryZipPath,
                        );
                    }
                }
            };

            await addDirectoryToZip(handle as FileSystemDirectoryHandle, "");
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

        for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];
            const fullDestPath = this.normalizePath(`${dest}/${relativePath}`);

            if (!zipEntry.dir) {
                const content = await zipEntry.async("blob");
                await this.write(fullDestPath, content);
            } else {
                await this.mkdir(fullDestPath);
            }
        }
    }
}