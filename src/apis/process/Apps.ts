import { XenFS } from '../files/XenFS';
import { RegisteredApps, AppManifest } from '../../types/global';
import { AppRuntime } from './AppRuntime';
import { Proccesses } from './Processes';
import JSZip from 'jszip';

export class AppManager {
    private fs: XenFS;
    private regFile = '/apps/registrations.json';
    private basePath = '/apps';
    private runtime: AppRuntime;

    constructor(fs: XenFS, processes: Proccesses) {
        this.fs = fs;
        this.runtime = new AppRuntime(processes);
    }

    private async getRegs(): Promise<RegisteredApps> {
        try {
            if (!await this.fs.exists(this.regFile)) {
                await this.fs.write(this.regFile, '[]', { create: true, recursive: true });
            }

            const content = await this.fs.read(this.regFile);
            return JSON.parse(content);
        } catch (err) {
            throw err;
        }
    }

    private async saveRegs(packageIds: RegisteredApps): Promise<void> {
        try {
            await this.fs.write(this.regFile, JSON.stringify(packageIds, null, 4), { create: true });
        } catch (err) {
            throw err;
        }
    }

    public async install(): Promise<void> {
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
            const zip = await JSZip.loadAsync(file);
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
            await this.fs.mkdir(appPath);

            for (const entryPath in zip.files) {
                const entry = zip.files[entryPath];
                const targetPath = `${appPath}/${entryPath}`;

                if (entry.dir) {
                    await this.fs.mkdir(targetPath);
                } else {
                    const content = await entry.async('blob');
                    await this.fs.write(targetPath, content, { create: true, recursive: true });
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
        try {
            const path = `${this.basePath}/${packageId}/manifest.json`;

            if (await this.fs.exists(path)) {
                const content = await this.fs.read(path);
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
        try {
            const path = `${this.basePath}/${packageId}`;
            if (await this.fs.exists(path)) await this.fs.remove(path);

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