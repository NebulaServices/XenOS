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
