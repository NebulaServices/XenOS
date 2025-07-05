export async function oobe() {
    if (!localStorage.getItem('XEN-OOBE')) {
        const req = await fetch('/files.json');
        const res = await req.json();

        Object.entries(res)[1].forEach(async (el: any) => {
            if (el == '/apps') return;

            el.forEach(async (el: any) => {
                console.log(el);
                if (!el.endsWith('.zip')) return;

                const filename = el;
                const dirname = filename.replace(/\.zip$/, '');

                const req = await fetch(`/apps/${filename}`);
                const arrBuff = await req.arrayBuffer();
                const buffer = new Uint8Array(arrBuff);

                if (!(await window.xen.fs.exists('/apps'))) {
                    await window.xen.fs.mkdir('/apps');
                    await window.xen.fs.write('/apps/registrations.json', '[]');
                }

                let regs = JSON.parse(await window.xen.fs.read('/apps/registrations.json', 'text') as string);
                regs.push(dirname);
                await window.xen.fs.write('/apps/registrations.json', JSON.stringify(regs));

                await window.xen.fs.write(`/apps/${filename}`, buffer);
                await window.xen.fs.mkdir(`/apps/${dirname}`);
                await window.xen.fs.decompress(`/apps/${filename}`, `/apps/${dirname}/`);
                await window.xen.fs.rm(`/apps/${filename}`);
            });

        });

        localStorage.setItem('XEN-OOBE', 'true');
    }
}