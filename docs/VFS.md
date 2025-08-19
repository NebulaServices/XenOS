# Virtual File Systems
Virtual File Systems let developers create their own FSs in XenOS

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
    abstract cd(path: string): Promise<void>;

    // Optional methods existing implementations
    async exists?(path: string): Promise<boolean>;
    async fetch?(url: string, path: string): Promise<void>;
    async download?(path: string): Promise<void>;
    async upload?(type: "file" | "directory", path: string): Promise<void>;
    async stat?(path: string): Promise<FileStat>;
    async compress?(path: string, dest: string): Promise<void>;
    async decompress?(path: string, dest: string): Promise<void>;
    async export?(): Promise<void>;
    async import?(): Promise<void>;
    
    // Other optional methods
    async init?(): Promise<void>; // You'll probably need this
    async link?(src: string, dest: string): Promise<void>;
    async unlink?(path: string): Promise<void>;
    async readlink?(path: string): Promise<string>;

    // XenFS-specific methods
    async mount?(path: string): Promise<void>;
    async unmount?(path: string): Promise<void>;
    async wipe?(): Promise<void>;
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

## Examples
- [Temporary FS that stores files in a map](./examples/map-fs.js)
- [WebDAV FS (made for Copyparty)](./examples/webdav-copyparty.js)