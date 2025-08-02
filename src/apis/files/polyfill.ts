export async function sofp(options: any = {}) {
    const opts = { multiple: !!options.multiple };
    const res = await window.xen.FilePicker.pick(opts);

    if (res === null) {
        throw new DOMException('The user aborted a request', 'AbortError');
    }

    const paths = Array.isArray(res.path) ? res.path : [res.path];
    const urls = Array.isArray(res.url) ? res.url || [] : res.url ? [res.url] : [];

    return paths.map((path, i) => {
        const name = path.split('/').pop() || '';
        const url = urls[i];
        return {
            kind: 'file',
            name,
            getFile: async () => {
                if (!url) throw new Error('No file URL available');

                const resp = await fetch(url);
                const blob = await resp.blob();

                return new File([blob], name, { type: blob.type });
            }
        }
    })
}

export async function sdp() {
    const res = await window.xen.FilePicker.pick({ mode: 'directory' });

    if (res === null) {
        throw new DOMException('The user aborted a request', 'AbortError');
    }

    const dirPath = Array.isArray(res.path) ? res.path[0] : res.path;
    const fs = window.xen.fs;

    function createFileHandle(path: string) {
        const name = path.split('/').pop() || '';
        return {
            kind: 'file',
            name,
            async getFile() {
                const blob = await fs.read(path, 'blob');
                return new File([blob], name, { type: (blob as Blob).type || '' });
            }
        }
    }

    function createDirHandle(path: string) {
        const name = path.split('/').pop() || '';
        return {
            kind: 'directory',
            name,
            async *entries() {
                const list = await fs.list(path);

                for (const e of list) {
                    const full = `${path}/${e.name}`.replace(/\/+/g, '/');

                    if (e.isDirectory) {
                        yield [e.name, createDirHandle(full)];
                    } else {
                        yield [e.name, createFileHandle(full)];
                    }
                }
            },
            async *values() {
                for await (const [, h] of this.entries()) yield h;
            },
            async *keys() {
                for await (const [n] of this.entries()) yield n;
            },
            [Symbol.asyncIterator]: async function* () {
                for await (const h of this.values()) yield h;
            },
            async getDirectoryHandle(name: string) {
                const full = `${path}/${name}`.replace(/\/+/g, '/');
                const stat = await fs.stat(full);

                if (!stat.isDirectory) throw new Error('Not a directory');
                return createDirHandle(full);
            },
            async getFileHandle(name: string) {
                const full = `${path}/${name}`.replace(/\/+/g, '/');
                const stat = await fs.stat(full);

                if (stat.isDirectory) throw new Error('Is a directory');
                return createFileHandle(full);
            },
            async removeEntry(name: string) {
                const full = `${path}/${name}`.replace(/\/+/g, '/');
                await fs.rm(full);
            },
            resolve(possibleDescendant: any) {
                const descPath = Array.isArray(possibleDescendant.path)
                    ? possibleDescendant.path[0]
                    : possibleDescendant.path;

                if (!descPath.startsWith(path)) return null;
                return descPath.slice(path.length).replace(/^\/+/, '');
            },

            async queryPermission() { return 'granted'; },
            async requestPermission() { return 'granted'; }
        }
    }

    return createDirHandle(dirPath);
}