import { Manifest } from "./PackageManager";

export class Runtime {
    public async exec(manifest: Manifest, args?: any) {
        let code: string;
        const width = manifest.window?.width || '600px';
        const height = manifest.window?.height || '400px';
        const resizable = manifest.window?.resizable || true;
        const xenFilePicker = manifest.window?.xenFilePicker ?? false;
        let icon: string;
        let url: string;

        if (manifest.type != 'webview') {
            url = new URL(manifest.source, `${location.origin}/fs/usr/apps/${manifest.id}/`).href;

            if (args) {
                const params = new URLSearchParams(args);
                console.log(params.toString());
                url += `?${params.toString()}`;
            }
        } else {
            //@ts-ignore
            url = window.__uv$config.prefix + window.__uv$config.encodeUrl(manifest.source);
        }

        if (manifest.icon) {
            icon = new URL(manifest.icon, `${location.origin}/fs/usr/apps/${manifest.id}/`).href;
        } else {
            icon = '/assets/logo.svg';
        }

        if (manifest.type == 'webview' || manifest.type == 'app') {
            code = `
                const win = window.xen.wm.create({
                    title: "${manifest.title}",
                    icon: "${icon}",
                    url: "${url}",
                    width: "${width}",
                    height: "${height}",
                    resizable: ${resizable},
                    xenFilePicker: ${xenFilePicker}
                });
                
                if (window.__PID__ !== undefined) {
                    window.xen.process.associateWindow(window.__PID__, win.id);
                    
                    win.onClose((closingWin) => {
                        setTimeout(() => {
                            if (window.__PID__ !== undefined) {
                                window.xen.process.kill(window.__PID__);
                            }
                        }, 0);
                    });
                }
            `;
        } else if (manifest.type == 'process') {
            const req = await fetch(url);
            const res = await req.text();

            code = res;
        }

        const pid = await window.xen.process.spawn({
            async: true,
            type: 'direct',
            content: code,
        });

        return pid;
    }

    public async import(manifest: Manifest) {
        const path = `/usr/libs/${manifest.id}/${manifest.source}`;

        try {
            const code = await window.xen.fs.read(path, 'text');
            const blob = new Blob([code], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            try {
                const module = await import(blobUrl);
                return module;
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        } catch (err) {
            console.error(`Error importing library ${manifest.id}:`, err);
            throw err;
        }
    }
}