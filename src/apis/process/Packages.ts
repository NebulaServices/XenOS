import { Manifest } from '../../types/Process';
import { Runtime } from './Runtime';

export class PackageManager {
    private appPath = '/apps';
    private libPath = '/libs';
    private runtime: Runtime;
    private zip: any;

    constructor() {
        this.runtime = new Runtime();
        this.zip = new window.JSZip();
    }

    private async getRegs(type: 'apps' | 'libs'): Promise<string[]> {
        const regs = window.xen.settings.get(type);
        return regs || [];
    }

    private async saveRegs(
        type: 'apps' | 'libs',
        packageIds: string[],
    ): Promise<void> {
        window.xen.settings.set(type, packageIds);
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

            const registryType = manifest.type === 'library' ? 'libs' : 'apps';
            const currentPath = registryType === 'apps' ? this.appPath : this.libPath;

            const regs = await this.getRegs(registryType);

            if (regs.includes(manifest.id)) {
                await this.remove(manifest.id);
            }

            const pkgPath = `${currentPath}/${manifest.id}`;
            await fs.mkdir(pkgPath);

            for (const entryPath in zip.files) {
                const entry = zip.files[entryPath];
                const targetPath = `${pkgPath}/${entryPath}`;

                if (entry.dir) {
                    await fs.mkdir(targetPath);
                } else {
                    const entryContent = await entry.async('blob');
                    await fs.write(targetPath, entryContent);
                }
            }

            const updatedRegs = await this.getRegs(registryType);

            if (!updatedRegs.includes(manifest.id)) {
                updatedRegs.push(manifest.id);
                await this.saveRegs(registryType, updatedRegs);
            }
        } catch (err) {
            throw err;
        }
    }

    public async getManifest(
        packageId: string,
        type: 'apps' | 'libs' | null = null,
    ): Promise<Manifest | undefined> {
        const fs = window.xen.fs;

        try {
            const types = type ? [type] : ['apps', 'libs'];

            for (const type of types) {
                const currentPath = type === 'apps' ? this.appPath : this.libPath;
                const path = `${currentPath}/${packageId}/manifest.json`;

                if (await fs.exists(path)) {
                    const content = (await fs.read(path, 'text')) as string;
                    const manifest = JSON.parse(content);
                    if (type && ((manifest.type === 'library' && type === 'libs') || (manifest.type !== 'library' && type === 'apps'))) {
                        return manifest;
                    } else if (!type) {
                        return manifest;
                    }
                }
            }

            return undefined;
        } catch (err) {
            throw err;
        }
    }

    public async open(packageId: string): Promise<void> {
        try {
            let regs = await this.getRegs('apps');

            if (regs.includes(packageId)) {
                const manifest = await this.getManifest(packageId, 'apps');
                if (manifest) await this.runtime.exec(manifest);
                return;
            }
        } catch (err) {
            throw err;
        }
    }

    public async remove(packageId: string): Promise<void> {
        const fs = window.xen.fs;

        try {
            let regs = await this.getRegs('apps');
            let registryType: 'apps' | 'libs' = 'apps';
            let currentPath = this.appPath;

            if (!regs.includes(packageId)) {
                regs = await this.getRegs('libs');

                if (!regs.includes(packageId)) {
                    return;
                }

                registryType = 'libs';
                currentPath = this.libPath;
            }

            const path = `${currentPath}/${packageId}`;
            if (await fs.exists(path)) await fs.rm(path);

            const length = regs.length;
            const updatedRegs = regs.filter((id) => id !== packageId);

            if (updatedRegs.length < length)
                await this.saveRegs(registryType, updatedRegs);
        } catch (err) {
            throw err;
        }
    }

    public async listApps(): Promise<Manifest[]> {
        const apps: Manifest[] = [];
        try {
            const regs = await this.getRegs('apps');

            for (const packageId of regs) {
                const manifest = await this.getManifest(packageId, 'apps');
                if (manifest) apps.push(manifest);
            }
        } catch (err) {
            throw err;
        }

        return apps;
    }

    public async listLibs(): Promise<Manifest[]> {
        const libs: Manifest[] = [];
        try {
            const regs = await this.getRegs('libs');

            for (const packageId of regs) {
                const manifest = await this.getManifest(packageId, 'libs');
                if (manifest) libs.push(manifest);
            }
        } catch (err) {
            throw err;
        }

        return libs;
    }
}