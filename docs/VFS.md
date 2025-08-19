# Virtual File Systems
Virtual File Systems let developers create their own FSs in XenOS.

## Types
### `FileSystem`
The abstract class that file systems should implement/extend
```ts
export abstract class FileSystem {
    // Required methods
    abstract mkdir(path: string): Promise<void>;
    abstract list(path: string, recursive?: boolean): Promise<FileEntryInfo[]>;
    abstract rm(path: string): Promise<void>;
    abstract write(path: string, content: Blob | string | ArrayBuffer): Promise<void>;
    abstract read(path: string, format?: "text" | "arrayBuffer" | "uint8array" | "blob"): Promise<string | ArrayBuffer | Uint8Array | Blob>;
    abstract exists(path: string): Promise<boolean>;
    abstract cd(path: string): Promise<void>;

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
Example FS & VFS implementation that creates a VFS at `/example` that stores all files in memory
```js
class ExampleFS extends window.xen.FileSystem {
    constructor() {
        super();
        this.nodes = new Map();
        this.cwd = '/';
        
        this.nodes.set('/', {
            type: 'directory',
            children: new Set()
        });
    }

    async mkdir(path) {
        const normPath = this.normalizePath(path);
        
        if (this.nodes.has(normPath)) {
            throw new Error(`Directory already exists: ${normPath}`);
        }
        
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
    }

    async list(path, recursive = false) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Directory not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        
        if (node.type !== 'directory') {
            throw new Error(`Not a directory: ${normPath}`);
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

    async rm(path) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Path not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        
        if (node.type === 'directory') {
            for (const childName of node.children) {
                const childPath = normPath === '/' ? `/${childName}` : `${normPath}/${childName}`;
                await this.rm(childPath);
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

    async write(path, content) {
        const normPath = this.normalizePath(path);
        const parentPath = normPath.substring(0, normPath.lastIndexOf('/')) || '/';
        
        if (!this.nodes.has(parentPath)) {
            await this.mkdir(parentPath);
        }
        
        let fileContent;
        let mimeType = 'application/octet-stream';
        
        if (typeof content === 'string') {
            fileContent = new TextEncoder().encode(content);
            mimeType = 'text/plain';
        } else if (content instanceof ArrayBuffer) {
            fileContent = new Uint8Array(content);
        } else if (content instanceof Uint8Array) {
            fileContent = content;
        } else if (content instanceof Blob) {
            mimeType = content.type;
            fileContent = new Uint8Array(await content.arrayBuffer());
        } else {
            throw new Error('Invalid content type');
        }
        
        const fileName = normPath.substring(normPath.lastIndexOf('/') + 1);
        
        this.nodes.set(normPath, {
            type: 'file',
            content: fileContent,
            mimeType: mimeType
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
            throw new Error(`Not a file: ${normPath}`);
        }
        
        const content = node.content;
        const mimeType = node.mimeType || 'application/octet-stream';
        
        switch (format) {
            case 'text':
                if (content instanceof Uint8Array) {
                    return new TextDecoder().decode(content);
                }
                return String(content);
                
            case 'arrayBuffer':
                if (content instanceof Uint8Array) {
                    return content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
                }
                return content;
                
            case 'uint8array':
                if (content instanceof Uint8Array) {
                    return content;
                }
                return new Uint8Array(content);
                
            case 'blob':
                return new Blob([content], { type: mimeType });
                
            default:
                return content;
        }
    }

    async exists(path) {
        const normPath = this.normalizePath(path);
        return this.nodes.has(normPath);
    }

    async cd(path) {
        const normPath = this.normalizePath(path);
        
        if (!this.nodes.has(normPath)) {
            throw new Error(`Directory not found: ${normPath}`);
        }
        
        const node = this.nodes.get(normPath);
        
        if (node.type !== 'directory') {
            throw new Error(`Not a directory: ${normPath}`);
        }
        
        this.cwd = normPath;
    }
}

window.exampleFS = new ExampleFS();
await window.xen.vfs.mount('/example', window.exampleFS);
```