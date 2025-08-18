import { FileSystem } from "../FileSystem";
import { XenFS } from "../XenFS";
import { VFS } from './VFS';

export class VFSManager {
    public vfs: VFS;

    constructor() {
        this.vfs = new VFS(new XenFS()); // Setup RootFS
    }

    async init(): Promise<void> {
        const rootFS = this.vfs.getMounts().find(m => m.path === "/")?.fs;

        if (rootFS && rootFS.init) {
            await rootFS.init();
        }
    }

    async mount(path: string, fs: FileSystem): Promise<void> {
        await this.vfs.mountFS(path, fs);
    }

    async unmount(path: string): Promise<void> {
        await this.vfs.unmountFS(path);
    }

    mounts() {
        return this.vfs.getMounts();
    }
}
