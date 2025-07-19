export async function initScripts() {
    let scripts: any;
    try {
        scripts = await window.xen.fs.list('/init');
    } catch {
        return;
    }

    scripts.forEach(async (el) => {
        if (el.isFile == true) {
            const script = await window.xen.fs.read(`/init/${el.name}`, 'text');
            window.xen.process.spawn((script as string), true);
        }
    });
}