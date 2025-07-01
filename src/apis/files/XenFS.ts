import { WriteOpts } from "../../types/global";

/*
interface Stat {
    name: string,
    size: number,
    isDirectory: boolean,
    isFile: boolean,
    isLink: boolean,
    linkPath?: string,
    createdAt: Date,
    lastModified: Date,
    lastAccessed: Date
}
*/

export class XenFS {
    public cwd: string = '/';
    private root: FileSystemDirectoryHandle;
    private mounts: Map<string, FileSystemDirectoryHandle> = new Map();

    async init(): Promise<void> {
        this.root = await navigator.storage.getDirectory();
    }

    private normalizePath(path: string): string {
        if (!path) return this.cwd;

        if (path.startsWith('~')) {
            path = '/root' + path.slice(1);
        }

        if (!path.startsWith('/')) {
            path = this.cwd + '/' + path;
        }

        const parts = path.split('/').filter(Boolean);
        const stack: string[] = [];

        for (const part of parts) {
            if (part === '.' || part === '') continue;

            if (part === '..') {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }

        return '/' + stack.join('/');
    }

    private splitPath(path: string): string[] {
        return this.normalizePath(path).split('/').filter(Boolean);
    }

    private async resolve(path: string, opts: WriteOpts = {}): Promise<FileSystemHandle> {
        const parts = this.splitPath(path);

        if (parts.length === 0) {
            return this.root;
        }

        let current = this.root;

        for (const [mntPath, mntHandle] of this.mounts.entries()) {
            if (this.normalizePath(path).startsWith(this.normalizePath(mntPath))) {
                const relPath = this.normalizePath(path).substring(this.normalizePath(mntPath).length);
                const relParts = relPath.split('/').filter(Boolean);
                let current: FileSystemDirectoryHandle = mntHandle;

                for (let i = 0; i < relParts.length - 1; i++) {
                    const part = relParts[i];
                    current = await current.getDirectoryHandle(part, { create: opts.recursive });
                }

                const final = relParts[relParts.length - 1];
                if (!final) return current;

                try {
                    return await current.getFileHandle(final, { create: opts.create });
                } catch {
                    return await current.getDirectoryHandle(final, { create: false });
                }
            }
        }

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            current = await current.getDirectoryHandle(part, { create: opts.recursive });
        }

        const final = parts[parts.length - 1];

        try {
            return await current.getFileHandle(final, { create: opts.create });
        } catch {
            return await current.getDirectoryHandle(final, { create: false });
        }
    }

    async mkdir(path: string): Promise<void> {
        const parts = this.splitPath(path);
        let current = this.root;

        for (const part of parts) {
            current = await current.getDirectoryHandle(part, { create: true });
        }
    }

    async rmdir(path: string): Promise<void> {
        const parts = this.splitPath(path);
        const name = parts.pop();

        const dir = await this.resolve('/' + parts.join('/')) as FileSystemDirectoryHandle;
        await dir.removeEntry(name!, { recursive: true });
    }

    async list(path: string, recursive: boolean = false): Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]> {
        const dir = await this.resolve(path) as FileSystemDirectoryHandle;
        const entries: { name: string; isFile: boolean; isDirectory: boolean }[] = [];

        for await (const entry of dir.values()) {
            const info = {
                name: entry.name,
                isFile: entry.kind === 'file',
                isDirectory: entry.kind === 'directory',
            };

            entries.push(info);

            if (recursive && entry.kind === 'directory') {
                const subEntries = await this.list(this.normalizePath(path + '/' + entry.name), true);
    
                entries.push(...subEntries.map(e => ({
                    ...e,
                    name: entry.name + '/' + e.name,
                })));
            }
        }

        return entries;
    }
    async write(path: string, content: any, opts: WriteOpts = {}): Promise<void> {
        const handle = await this.resolve(path, opts) as FileSystemFileHandle;
        const writable = await handle.createWritable();

        if (content instanceof Blob) {
            await writable.write(content);
        } else if (typeof content === 'string') {
            await writable.write(new Blob([content], { type: 'text/plain' }));
        } else {
            await writable.write(new Blob([content]));
        }

        await writable.close();
    }

    async read(path: string): Promise<string> {
        const handle = await this.resolve(path) as FileSystemFileHandle;
        const file = await handle.getFile();

        const text = await file.text();
        return text;
    }

    async remove(path: string): Promise<void> {
        const parts = this.splitPath(path);
        const name = parts.pop();

        const dir = await this.resolve('/' + parts.join('/')) as FileSystemDirectoryHandle;
        await dir.removeEntry(name!, { recursive: true });
    }

    async exists(path: string): Promise<boolean> {
        try {
            await this.resolve(path);
            return true;
        } catch {
            return false;
        }
    }

    async touch(path: string, recursive: boolean = false): Promise<void> {
        await this.write(path, '', { create: true, recursive });
    }

    async move(src: string, dest: string): Promise<void> {
        const file = await this.read(src);

        await this.write(dest, file, { create: true, recursive: true });
        await this.remove(src);
    }

    async copy(src: string, dest: string): Promise<void> {
        const file = await this.read(src);
        await this.write(dest, file, { create: true, recursive: true });
    }

    async pwd(): Promise<string> {
        return this.cwd;
    }

    async cd(path: string): Promise<void> {
        const newPath = this.normalizePath(path);

        const handle = await this.resolve(newPath);
        if (handle.kind !== 'directory') throw new Error(`${newPath} is not a directory`);

        this.cwd = newPath;
    }

    async fetch(url: string, path: string): Promise<void> {
        const res = await fetch(url); // TODO: UV encoding
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText} (${res.status})`)
    
        const blob = await res.blob();

        await this.write(path, blob, {
            create: true,
            recursive: true
        });
    }

    async mount(path: string): Promise<void> {
        const handle = await window.showDirectoryPicker();
        this.mounts.set(this.normalizePath(path), handle);
    }

    async unmount(path: string): Promise<void> {
        this.mounts.delete(this.normalizePath(path));
    }

    async upload(path: string): Promise<void> {
        const [handle] = await window.showOpenFilePicker();
        const file = await handle.getFile();

        await this.write(path, file, { create: true, recursive: true });
    }

    async download(path: string): Promise<void> {
        const handle = (await this.resolve(path)) as FileSystemFileHandle;
        const file = await handle.getFile();
    
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
    
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    /*
    async stat(path: string): Promise<Stat> {}
    async link(path: string, target: string): Promise<void> {}
    async unlink(path: string): Promise<void> {}
    async readlink(path: string): Promise<string> {}
    async chmod(path: string, mode: number): Promise<void> {}
    async chown(path: string, uid: number, gid: number): Promise<void>
    async export(): Promise<void> {}
    async compress(path: string, dest: string): Promise<void> {}
    async decompress(path: string, dest: string): Promise<void> {}
    async watch(path: string, callback: (event: string, path: string) => void): Promise<void> {}
    async unwatch(path: string): Promise<void> {}
    */
}