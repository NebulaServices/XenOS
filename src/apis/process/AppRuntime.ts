import { AppManifest } from "../../types/Process";

export class AppRuntime {
    public async exec(manifest: AppManifest) {
        let code: string;

        if (manifest.type == 'webview') {
            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${manifest.icon}',
                    url: '${manifest.source.url}'     
                });
            `;
        } else if (manifest.type == 'manual') {
            const encodedUrl = new URL(manifest.source.background, `${location.origin}/fs/apps/${manifest.packageId}/`).href;

            const req = await fetch(encodedUrl);
            const res = await req.text();

            code = res;
        } else if (manifest.type == 'auto') {
            const encodedUrl = new URL(manifest.source.index, `${location.origin}/fs/apps/${manifest.packageId}/`).href;

            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${manifest.icon}',
                    url: '${encodedUrl}'     
                });
            `;
        }

        window.xen.process.spawn(code, true);
    }
}