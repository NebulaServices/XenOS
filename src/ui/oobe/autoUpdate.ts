async function update() {
    const req = await fetch('/files.json');
    const res = await req.json();
    const fs = window.xen.fs;

    if (!(await fs.exists('/apps'))) {
        await fs.mkdir('/apps');
    }

    if (Array.isArray(Object.entries(res)[1])) {
        for (const el of Object.entries(res)[1]) {
            if (Array.isArray(el)) {
                for (const filename of el) {
                    if (!filename.endsWith('.zip')) continue;

                    const appPath = `/apps/${filename}`;
                    const req = await fetch(appPath);
                    const buffer = new Uint8Array(await req.arrayBuffer());

                    await fs.write(appPath, buffer);
                    await window.xen.apps.install('opfs', appPath);
                    await fs.rm(appPath);
                }
            }
        }
    }
}

export async function oobe() {
    if (!window.xen.settings.get('oobe')) {
        await update();

        window.xen.settings.set('oobe', true);
        window.xen.settings.set('build-cache', window.xen.version.build);
    }

    if (window.xen.version.build != window.xen.settings.get('build-cache')) {
        await update();
        window.xen.settings.set('build-cache', window.xen.version.build);
    }
}