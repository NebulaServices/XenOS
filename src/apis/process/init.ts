export async function init() {
    let scripts: any;
    let doScripts: boolean;

    try {
        scripts = await window.xen.fs.list('/init');
        doScripts = true;
    } catch {
        doScripts = false;
    }

    if (doScripts == true) {
        scripts.forEach(async (el) => {
            if (el.isFile == true) {
                const script = (await window.xen.fs.read(`/init/${el.name}`, 'text') as string);

                window.xen.process.spawn({
                    async: true,
                    type: 'direct',
                    content: script
                });
            }
        });
    }

    if (window.xen.settings.get('start-up')) {
        window.xen.settings.get('start-up').forEach(async (id: string) => {
            await window.xen.packages.open(id);
        });
    }
}