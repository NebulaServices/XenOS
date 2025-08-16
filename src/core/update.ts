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

export async function update() {
    const splash = (window as any).bootSplash;
    if (splash) {
        splash.updateSubtext("Downloading resources... (depending on your internet, this could take a while)");
    }
    
    await install('apps');
    await install('libs');
}

export async function updater() {
    await window.xen.fs.rm('/system');
    await update();

    window.xen.settings.set('build-cache', window.xen.version.build);
    
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
        await reg.unregister();
    }
    
    setTimeout(() => {
        window.parent.location.reload();
    }, 1500);
}