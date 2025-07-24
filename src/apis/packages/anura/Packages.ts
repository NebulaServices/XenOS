import JSZip from "jszip";
import { Manifest } from "../PackageManager";

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

export class AnuraPackages {
    private zip: JSZip;

    constructor() {
        this.zip = new JSZip();
    }

    public manifestConverter(anuraM: AnuraManifest): Manifest {
        const manifest: Manifest = {
            id: anuraM.package,
            version: '1.0.0',
            title: anuraM.name,
            icon: anuraM.icon,
            type: 'app',
            source: anuraM.index,
            maintainer: {
                name: 'ATL'
            },
            window: {
                width: anuraM.wininfo.width || '1000px',
                height: anuraM.wininfo.height || '500px',
                resizable: anuraM.wininfo.resizable || true
            }
        };

        return manifest;
    }

    public async install(
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

            const parsedManifest = this.manifestConverter(manifest);
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
            await window.xen.packages.install('opfs', `/temp/anura/${parsedManifest.id}.zip`);
            await fs.rm('/temp/anura');

        } catch (err) {
            throw err;
        }
    }
}