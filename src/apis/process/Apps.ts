import { Manifest } from '../../types/Process';
import { AppRuntime } from './Runtime';

export class AppManager {
    private regFile = '/apps/registrations.json';
    private basePath = '/apps';
    private runtime: AppRuntime;
    private zip: any;

    constructor() {
        this.runtime = new AppRuntime();
        this.zip = new window.JSZip();
    }

    private async getRegs(): Promise<string[]> {
        const fs = window.xen.fs;

        try {
            if (!(await fs.exists(this.regFile))) {
                await fs.write(this.regFile, '[]');
            }

            const content = (await fs.read(this.regFile, 'text')) as string;
            return JSON.parse(content);
        } catch (err) {
            throw err;
        }
    }

    private async saveRegs(packageIds: string[]): Promise<void> {
        const fs = window.xen.fs;

        try {
            await fs.write(this.regFile, JSON.stringify(packageIds, null, 4));
        } catch (err) {
            throw err;
        }
    }

    public async install(
        source: 'prompt' | 'opfs' | 'url',
        path?: string,
    ): Promise<void> {
        const fs = window.xen.fs;
        let file: File | null = null;
        let content: ArrayBuffer | Blob;

        try {
            if (source === 'prompt') {
                const [handle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: 'Zip Archives',
                            accept: {
                                'application/zip': ['.zip'],
                            },
                        },
                    ],
                });

                file = await handle.getFile();
                content = await file.arrayBuffer();
            } else if (source === 'opfs' && path) {
                if (!(await fs.exists(path))) {
                    throw new Error(`Couldn't find OPFS path: ${path}`);
                }

                content = (await fs.read(path, 'blob')) as Blob;
            } else if (source === 'url' && path) {
                const response = await fetch(path);

                if (!response.ok) {
                    throw new Error(`Failed to fetch from URL: ${path}`);
                }

                content = await response.blob(); 
            } else {
                throw new Error('Invalid install source or missing OPFS path');
            }

            const zip = await this.zip.loadAsync(content);
            let manifest: Manifest | undefined;

            for (const entry in zip.files) {
                if (entry === 'manifest.json') {
                    const content = await zip.files[entry].async('text');
                    manifest = JSON.parse(content);

                    break;
                }
            }

            if (!manifest) throw new Error('manifest.json not found');

            const regs = await this.getRegs();

            if (regs.includes(manifest.id)) {
                await this.remove(manifest.id);
            }

            const appPath = `${this.basePath}/${manifest.id}`;
            await fs.mkdir(appPath);

            for (const entryPath in zip.files) {
                const entry = zip.files[entryPath];
                const targetPath = `${appPath}/${entryPath}`;

                if (entry.dir) {
                    await fs.mkdir(targetPath);
                } else {
                    const content = await entry.async('blob');
                    await fs.write(targetPath, content);
                }
            }

            const updatedRegs = await this.getRegs();

            if (!updatedRegs.includes(manifest.id)) {
                updatedRegs.push(manifest.id);
                await this.saveRegs(updatedRegs);
            }
        } catch (err) {
            throw err;
        }
    }

    public async getManifest(
        packageId: string,
    ): Promise<Manifest | undefined> {
        const fs = window.xen.fs;

        try {
            const path = `${this.basePath}/${packageId}/manifest.json`;

            if (await fs.exists(path)) {
                const content = (await fs.read(path, 'text')) as string;
                return JSON.parse(content);
            }

            return undefined;
        } catch (err) {
            throw err;
        }
    }

    public async open(packageId: string): Promise<void> {
        console.log(packageId);

        try {
            const regs = await this.getRegs();
            if (!regs.includes(packageId)) return;

            const manifest = await this.getManifest(packageId);
            await this.runtime.exec(manifest);
        } catch (err) {
            throw err;
        }
    }

    public async remove(packageId: string): Promise<void> {
        const fs = window.xen.fs;

        try {
            const path = `${this.basePath}/${packageId}`;
            if (await fs.exists(path)) await fs.rm(path);

            let regs = await this.getRegs();

            const length = regs.length;
            regs = regs.filter((id) => id !== packageId);

            if (regs.length < length) await this.saveRegs(regs);
        } catch (err) {
            throw err;
        }
    }

    public async listApps(): Promise<Manifest[]> {
        const apps: Manifest[] = [];
        try {
            const regs = await this.getRegs();

            for (const packageId of regs) {
                const manifest = await this.getManifest(packageId);
                if (manifest) apps.push(manifest);
            }
        } catch (err) {
            throw err;
        }

        return apps;
    }
}