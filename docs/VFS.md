# Virtual File Systems
Virtual File Systems let developers create their own FSs in XenOS.

## Types
### `FileSystem`
The abstract class that file systems should implement/extend
```ts
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
    abstract pwd(): Promise<string>;
    abstract cd(path: string): Promise<void>;
    abstract copy(src: string, dest: string): Promise<void>;
    abstract move(src: string, dest: string): Promise<void>;

    // Optional methods
    async init?(): Promise<void>;
    async fetch?(url: string, path: string): Promise<void>;
    async mount?(path: string): Promise<void>;
    async unmount?(path: string): Promise<void>;
    async upload?(type: "file" | "directory", path: string): Promise<void>;
    async download?(path: string): Promise<void>;
    async stat?(path: string): Promise<FileStat>;
    async compress?(path: string, dest: string): Promise<void>;
    async decompress?(path: string, dest: string): Promise<void>;
    async link?(src: string, dest: string): Promise<void>;
    async unlink?(path: string): Promise<void>;
    async readlink?(path: string): Promise<string>;
    async wipe?(): Promise<void>;
    async export?(): Promise<void>;
    async import?(): Promise<void>;
}
```

### `FileStat`
```ts
export interface FileStat {
    name: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    lastModified: Date;
    mime: string | null;
}
```

### `FileEntryInfo`
```ts
export interface FileEntryInfo {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}
```

## Example
Example FS & VFS implementation that creates a VFS at `/tmp` that stores all files in memory
```js
class ExampleFS {
    constructor() {
        this.nodes = new Map();
        this.cwd = '/';
        
        this.nodes.set('/', {
            type: 'directory',
            children: new Set()
        });
    }

    normalizePath(path, cwd = this.cwd) {
        if (!path) return cwd;
        if (path.startsWith("~")) path = "/usr" + path.slice(1);
        if (!path.startsWith("/")) path = cwd + "/" + path;

        const parts = path.split("/").filter(Boolean);
        const stack = [];

        for (const part of parts) {
            if (part === "." || part === "") continue;
            if (part === "..") {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }

        let norm = "/" + stack.join("/");
        if (norm === "//") norm = "/";
        return norm;
    }

    async exists(path) {
        const normPath = this.normalizePath(path);
        return this.nodes.has(normPath);
    }

    async mkdir(path, recursive = true) {
        const normPath = this.normalizePath(path);

        if (this.nodes.has(normPath)) {
            throw new Error(`Dir exists: ${normPath}`);
        }

        if (recursive) {
            const parts = normPath.split('/').filter(Boolean);
            let currPath = '';
            
            for (const part of parts) {
                currPath += '/' + part;
                if (!this.nodes.has(currPath)) {
                    this.nodes.set(currPath, {
                        type: 'directory',
                        children: new Set()
                    });
                    
                    const parentPath = currPath.substring(0, currPath.lastIndexOf('/')) || '/';
                    if (this.nodes.has(parentPath)) {
                        this.nodes.get(parentPath).children.add(part);
                    }
                }
            }
        } else {
            const parentPath = normPath.substring(0, normPath.lastIndexOf('/')) || '/';
            if (!this.nodes.has(parentPath)) {
                throw new Error(`Parent missing: ${parentPath}`);
            }
            
            const dirName = normPath.substring(normPath.lastIndexOf('/') + 1);
            this.nodes.set(normPath, {
                type: 'directory',
                children: new Set()
            });
            
            this.nodes.get(parentPath).children.add(dirName);
        }
    }

    async list(path, recursive = false) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Dir not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        if (node.type !== 'directory') {
            throw new Error(`Not dir: ${normPath}`);
        }
        
        const entries = [];
        
        for (const childName of node.children) {
            const childPath = normPath === '/' ? `/${childName}` : `${normPath}/${childName}`;
            const childNode = this.nodes.get(childPath);
            
            if (childNode) {
                entries.push({
                    name: childName,
                    isFile: childNode.type === 'file',
                    isDirectory: childNode.type === 'directory'
                });

                if (recursive && childNode.type === 'directory') {
                    const subEntries = await this.list(childPath, true);
                    entries.push(...subEntries.map(entry => ({
                        name: `${childName}/${entry.name}`,
                        isFile: entry.isFile,
                        isDirectory: entry.isDirectory
                    })));
                }
            }
        }

        return entries;
    }

    async write(path, content) {
        const normPath = this.normalizePath(path);
        
        const parentPath = normPath.substring(0, normPath.lastIndexOf('/')) || '/';
        if (!this.nodes.has(parentPath)) {
            await this.mkdir(parentPath, true);
        }
        
        let fileContent;
        
        if (typeof content === 'string') {
            fileContent = content;
        } else if (content instanceof ArrayBuffer) {
            fileContent = new Uint8Array(content);
        } else if (content instanceof Uint8Array) {
            fileContent = content;
        } else if (content instanceof Blob) {
            fileContent = new Uint8Array(await content.arrayBuffer());
        } else {
            throw new Error('Invalid content type');
        }
        
        const fileName = normPath.substring(normPath.lastIndexOf('/') + 1);
        
        this.nodes.set(normPath, {
            type: 'file',
            content: fileContent
        });

        const parentNode = this.nodes.get(parentPath);
        if (parentNode && parentNode.type === 'directory') {
            parentNode.children.add(fileName);
        }
    }

    async read(path, format = 'text') {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`File not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        if (node.type !== 'file') {
            throw new Error(`Not file: ${normPath}`);
        }
        
        const content = node.content;
        
        switch (format) {
            case 'text':
                if (typeof content === 'string') {
                    return content;
                } else if (content instanceof Uint8Array) {
                    return new TextDecoder().decode(content);
                }
                return String(content);
                
            case 'arrayBuffer':
                if (content instanceof Uint8Array) {
                    return content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
                } else if (typeof content === 'string') {
                    return new TextEncoder().encode(content).buffer;
                }
                return content;
                
            case 'uint8array':
                if (content instanceof Uint8Array) {
                    return content;
                } else if (typeof content === 'string') {
                    return new TextEncoder().encode(content);
                }
                return new Uint8Array(content);
                
            case 'blob':
                if (content instanceof Uint8Array) {
                    return new Blob([content]);
                } else if (typeof content === 'string') {
                    return new Blob([content], { type: 'text/plain' });
                }
                return new Blob([content]);
                
            default:
                return content;
        }
    }

    async rm(path, recursive = false) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Path not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        
        if (node.type === 'directory') {
            if (node.children.size > 0 && !recursive) {
                throw new Error(`Dir not empty: ${normPath}`);
            }
            
            if (recursive) {
                for (const childName of node.children) {
                    const childPath = normPath === '/' ? `/${childName}` : `${normPath}/${childName}`;
                    await this.rm(childPath, true);
                }
            }
        }
        
        if (normPath !== '/') {
            const parentPath = normPath.substring(0, normPath.lastIndexOf('/')) || '/';
            const fileName = normPath.substring(normPath.lastIndexOf('/') + 1);
            
            if (this.nodes.has(parentPath)) {
                const parentNode = this.nodes.get(parentPath);
                if (parentNode.children) {
                    parentNode.children.delete(fileName);
                }
            }
        }
        
        this.nodes.delete(normPath);
    }

    async copy(src, dest) {
        const srcPath = this.normalizePath(src);
        const destPath = this.normalizePath(dest);
        
        if (!this.nodes.has(srcPath)) {
            throw new Error(`Source not found: ${srcPath}`);
        }
        
        const srcNode = this.nodes.get(srcPath);
        
        if (srcNode.type === 'file') {
            await this.write(destPath, srcNode.content);
        } else if (srcNode.type === 'directory') {
            await this.mkdir(destPath, true);
            
            for (const childName of srcNode.children) {
                const childSrcPath = srcPath === '/' ? `/${childName}` : `${srcPath}/${childName}`;
                const childDestPath = destPath === '/' ? `/${childName}` : `${destPath}/${childName}`;
                await this.copy(childSrcPath, childDestPath);
            }
        }
    }

    async move(src, dest) {
        await this.copy(src, dest);
        await this.rm(src, true);
    }

    async pwd() {
        return this.cwd;
    }

    async cd(path) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Dir not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        if (node.type !== 'directory') {
            throw new Error(`Not dir: ${normPath}`);
        }
        
        this.cwd = normPath;
    }

    async open(path, callback) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`File not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        if (node.type !== 'file') {
            throw new Error(`Not file: ${normPath}`);
        }
        
        if (window.xen && window.xen.fs && window.xen.fs.open) {
            return await window.xen.fs.open(normPath, callback);
        }
    }
}

window.exampleFS = new ExampleFS();
await window.xen.vfs.mount('/example', window.exampleFS);
```