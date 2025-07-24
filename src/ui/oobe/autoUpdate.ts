async function install(type: 'apps' | 'libs') {
    const req = await fetch('/files.json');
    const res = await req.json();
    const fs = window.xen.fs;
    let index: number;

    if (type == 'apps') {
        index = 1;
    } else {
        index = 3;
    }

    if (!(await fs.exists(`/usr/${type}`))) {
        await fs.mkdir(`/usr/${type}`);
    }

        if (Array.isArray(Object.entries(res)[index])) {
        for (const el of Object.entries(res)[index]) {
            if (Array.isArray(el)) {
                for (const filename of el) {
                    if (!filename.endsWith('.zip')) continue;

                    const path = `/${type}/${filename}`;
                    await window.xen.packages.install('url', path);
                }
            }
        }
    }
}

async function update() {
    await install('apps');
    await install('libs');
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