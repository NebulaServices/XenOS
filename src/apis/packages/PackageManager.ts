import { Runtime } from './Runtime';
import { packageHandler } from '../policy/handler';
import JSZip from 'jszip';

export interface Manifest {
    id: string;
    version: string;

    title?: string;
    description?: string;
    icon?: string;

    type: 'webview' | 'app' | 'process' | 'library';
    source: string;

    maintainer?: {
        name?: string;
        email?: string;
        website?: string;
    }

    window?: {
        width?: string;
        height?: string;
        resizable?: boolean;
        xenFilePicker?: boolean;
    };

    installHook?: string
}

interface AnuraManifest {
    name: string;
    type: 'auto';
    package: string;
    index: string;
    icon: string;
    wininfo: {
        title?: string;
        width?: string;
        height?: string;
        resizable?: boolean;
    };
}

export class PackageManager {
    private appPath = '/usr/apps';
    private libPath = '/usr/libs';
    private runtime: Runtime;
    private zip: JSZip;

    constructor() {
        this.runtime = new Runtime();
        this.zip = new JSZip();
    }

    public anuraToXen(anuraM: AnuraManifest): Manifest {
        const manifest: Manifest = {
            id: anuraM.package,
            version: '1.0.0',
            title: anuraM.name,
            icon: anuraM.icon,
            type: 'app',
            source: anuraM.index,
            window: {
                width: anuraM.wininfo.width || '1000px',
                height: anuraM.wininfo.height || '500px',
                resizable: anuraM.wininfo.resizable || true
            }
        };

        return manifest;
    }

    public async getRegs(type: 'apps' | 'libs'): Promise<string[]> {
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

            if (!await packageHandler(manifest.id, 'install')) {
                window.xen.notifications.spawn({
                    title: "XenOS",
                    description: "This package has been blocked by your policy and cannot be installed",
                    icon: "/assets/logo.svg",
                    timeout: 2500
                });

                throw new Error('Package blocked by policy');
            }

            const registryType = manifest.type === 'library' ? 'libs' : 'apps';
            const currentPath = registryType === 'apps' ? this.appPath : this.libPath;

            const regs = await this.getRegs(registryType);

            if (regs.includes(manifest.id)) {
                await this.remove(manifest.id, 'update');
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

            if (manifest.installHook) {
                const path = `${pkgPath}/${manifest.installHook}`
                if (await fs.exists(path)) {
                    const code = (await fs.read(path, 'text')) as string
                    await window.xen.process.spawn({
                        async: false,
                        type: 'direct',
                        content: code
                    });
                }
            }
        } catch (err) {
            throw err;
        }
    }

    public async anuraInstall(
        source: 'prompt' | 'opfs' | 'url',
        path?: string
    ) {
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
            let manifest: AnuraManifest | undefined;

            for (const entry in zip.files) {
                if (entry === 'manifest.json') {
                    const content = await zip.files[entry].async('text');
                    manifest = JSON.parse(content);

                    break;
                }
            }

            if (!manifest) throw new Error('manifest.json not found');

            const parsedManifest = this.anuraToXen(manifest);
            const pkgPath = `/temp/anura/${parsedManifest.id}`;

            await fs.mkdir(pkgPath);

            for (const entryPath in zip.files) {
                const entry = zip.files[entryPath];
                const targetPath = `${pkgPath}/${entryPath}`;

                if (entry.dir) {
                    await fs.mkdir(targetPath);
                } else if (entry.name == 'manifest.json') {
                    const entryContent = JSON.stringify(parsedManifest, null, 2);
                    await fs.write(targetPath, entryContent);
                } else {
                    const entryContent = await entry.async('blob');
                    await fs.write(targetPath, entryContent);
                }
            }

            await fs.compress(pkgPath, `/temp/anura/${parsedManifest.id}.zip`);
            await this.install('opfs', `/temp/anura/${parsedManifest.id}.zip`);
            await fs.rm('/temp/anura');

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

    public async open(packageId: string, args?: any): Promise<void> {
        try {
            let regs = await this.getRegs('apps');

            if (regs.includes(packageId)) {
                const manifest = await this.getManifest(packageId, 'apps');

                if (manifest) {
                    if (args) {
                        await this.runtime.exec(manifest, args);
                    } else {
                        await this.runtime.exec(manifest);
                    }
                };

                return;
            }

            regs = await this.getRegs('libs');

            if (regs.includes(packageId)) {
                throw new Error(`Cannot 'open' a library (${packageId}). Use 'import' instead.`,);
            }

            throw new Error(`Package ${packageId} not found`);
        } catch (err) {
            throw err;
        }
    }

    public async import(packageId: string) {
        try {
            let regs = await this.getRegs('libs');

            if (regs.includes(packageId)) {
                const manifest = await this.getManifest(packageId, 'libs');
                if (manifest) return await this.runtime.import(manifest);
                return;
            }

            regs = await this.getRegs('apps');

            if (regs.includes(packageId)) {
                throw new Error(`Cannot 'import' an app (${packageId}). Use 'open' instead.`);
            }

            throw new Error(`Package ${packageId} not found`);
        } catch (err) {
            throw err;
        }
    }

    public async remove(packageId: string, type?: string): Promise<void> {
        const fs = window.xen.fs;

        if (!type) {
            if (packageId.startsWith('org.nebulaservices.')) {
                window.xen.notifications.spawn({
                    title: "XenOS",
                    description: "This package is a core application and cannot be uninstalled",
                    icon: "/assets/logo.svg",
                    timeout: 2500
                });

                throw new Error('Package cannot be uninstalled');
            }

            if (!await packageHandler(packageId, 'uninstall')) {
                window.xen.notifications.spawn({
                    title: "XenOS",
                    description: "This package is force install by your policy and cannot be uninstalled",
                    icon: "/assets/logo.svg",
                    timeout: 2500
                });

                throw new Error('Package is force installed by policy');
            }
        }

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