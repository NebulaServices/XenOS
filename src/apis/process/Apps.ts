import { RegisteredApps, AppManifest } from '../../types/Process';
import { AppRuntime } from './AppRuntime';

export class AppManager {
    private regFile = '/apps/registrations.json';
    private basePath = '/apps';
    private runtime: AppRuntime;
    private zip: any;

    constructor() {
        this.runtime = new AppRuntime();
        this.zip = new window.JSZip();
    }

    private async getRegs(): Promise<RegisteredApps> {
        const fs = window.xen.fs;

        try {
            if (!await fs.exists(this.regFile)) {
                await fs.write(this.regFile, '[]');
            }

            const content = await fs.read(this.regFile, 'text') as string;
            return JSON.parse(content);
        } catch (err) {
            throw err;
        }
    }

    private async saveRegs(packageIds: RegisteredApps): Promise<void> {
        const fs = window.xen.fs;

        try {
            await fs.write(this.regFile, JSON.stringify(packageIds, null, 4));
        } catch (err) {
            throw err;
        }
    }

    public async install(): Promise<void> {
        const fs = window.xen.fs;

        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Zip Archives',
                    accept: {
                        'application/zip': ['.zip'],
                    },
                }],
            });

            const file = await handle.getFile();
            const zip = await this.zip.loadAsync(file);
            let manifest: AppManifest | undefined;

            for (const entry in zip.files) {
                if (entry === 'manifest.json') {
                    const content = await zip.files[entry].async('text');
                    manifest = JSON.parse(content);

                    break;
                }
            }

            if (!manifest) throw new Error('manifest.json not found');

            const appPath = `${this.basePath}/${manifest.packageId}`;
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

            const regs = await this.getRegs();

            if (!regs.includes(manifest.packageId)) {
                regs.push(manifest.packageId);
                await this.saveRegs(regs);
            }
        } catch (err) {
            throw err;
        }
    }

    public async getManifest(packageId: string): Promise<AppManifest | undefined> {
        const fs = window.xen.fs;

        try {
            const path = `${this.basePath}/${packageId}/manifest.json`;

            if (await fs.exists(path)) {
                const content = await fs.read(path, 'text') as string;
                return JSON.parse(content);
            }

            return undefined;
        } catch (err) {
            throw err;
        }
    }

    public async open(packageId: string): Promise<void> {
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
            regs = regs.filter(id => id !== packageId);

            if (regs.length < length) await this.saveRegs(regs);
        } catch (err) {
            throw err;
        }
    }

    public async listApps(): Promise<AppManifest[]> {
        const apps: AppManifest[] = [];
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