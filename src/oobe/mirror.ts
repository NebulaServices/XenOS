// This is the worst code I have ever written
/* TODO: Everything*/
export async function mirror() {
    /*
    const req = await fetch('/files.json');
    const res = await req.text();

    Object.entries(JSON.parse(res, null)).forEach(async (arr: any) => {
        if (arr[1].length == 0) return;

        if (arr[0] == '/') {
            arr[1].forEach(async (el) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/system/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        }

        if (arr[0] == '/dist') {
            arr[1].forEach(async (el) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/lib/xen/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        }

        if (arr[0] == '/uv') {
            arr[1].forEach(async (el) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/etc/uv/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        }

        if (arr[0].startsWith('/libs/comlink/esm')) {
            arr[1].forEach(async (el: any) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/libs/comlink/esm/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        };

        if (arr[0].startsWith('/libs/comlink/umd')) {
            arr[1].forEach(async (el: any) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/libs/comlink/umd/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        };

        if (arr[0].startsWith('/libs')) {
            const array = arr[0].split('/');
            const dir = array[2];
            const files = arr[1];

            files.forEach(async (el: any) => {
                const req = await fetch(`${location.href}${arr[0]}/${el}`);
                const res = await req.text();

                await window.xen.fs.write(`/lib/${dir}/${el}`, res, {
                    create: true,
                    recursive: true
                });
            });
        }
    });
    */
}