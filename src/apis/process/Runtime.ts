import { Manifest } from "../../types/Process";

export class AppRuntime {
    public async exec(manifest: Manifest) {
        let code: string;
        const width = manifest.window?.width || '600px';
        const height = manifest.window?.height || '400px';
        const resizable = manifest.window?.resizable || true;
        let icon: string;
        let url: string;

        if (manifest.type != 'webview') {
            url = new URL(manifest.source, `${location.origin}/fs/apps/${manifest.id}/`).href;
        } else {
            //@ts-ignore
            url = window.__uv$config.prefix + window.__uv$config.encodeUrl(manifest.source)
        }

        if (manifest.icon) {
            icon = new URL(manifest.icon, `${location.origin}/fs/apps/${manifest.id}/`).href;
        } else {
            icon = '/logo.png';
        }

        if (manifest.type == 'webview' || manifest.type == 'app') {
            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${icon}',
                    url: '${url}',
                    width: '${width}',
                    height: '${height}',
                    resizable: ${resizable}
                });
            `;
        } else if (manifest.type == 'process') {
            const req = await fetch(url);
            const res = await req.text();

            code = res;
        }

        window.xen.process.spawn(code, true);
    }
}