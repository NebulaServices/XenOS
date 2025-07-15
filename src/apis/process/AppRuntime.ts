import { AppManifest } from "../../types/Process";

export class AppRuntime {
    public async exec(manifest: AppManifest) {
        let code: string;
        const width = manifest.window?.width || '600px';
        const height = manifest.window?.height || '400px';
        let resizable: boolean = manifest.window?.resizable ?? true;

        if (manifest.type == 'webview') {
            const encodedIcon = new URL(manifest.icon, `${location.origin}/fs/apps/${manifest.packageId}/`).href;
            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${encodedIcon}',
                    url: '${manifest.source.url}',
                    width: '${width}',
                    height: '${height}',
                    resizable: ${resizable}
                });
            `;
        } else if (manifest.type == 'manual') {
            const encodedUrl = new URL(manifest.source.background, `${location.origin}/fs/apps/${manifest.packageId}/`).href;

            const req = await fetch(encodedUrl);
            const res = await req.text();

            code = res;
        } else if (manifest.type == 'auto') {
            const encodedUrl = new URL(manifest.source.index, `${location.origin}/fs/apps/${manifest.packageId}/`).href;
            const encodedIcon = new URL(manifest.icon, `${location.origin}/fs/apps/${manifest.packageId}/`).href;
            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${encodedIcon}',
                    url: '${encodedUrl}',
                    width: '${width}',
                    height: '${height}',
                    resizable: ${resizable}
                });
            `;
        }

        window.xen.process.spawn(code, true);
    }
}