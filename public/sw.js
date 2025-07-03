/*
TODO:
- Make it actually work but not randomly
- Make it boot from OPFS
- Rewrite in Typescript
*/

Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: false,
});

importScripts("/libs/comlink/umd/comlink.min.js");
importScripts("/libs/workbox/workbox-sw.js");

workbox.setConfig({
    debug: false,
    modulePathPrefix: "/libs/workbox",
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();

addEventListener('message', async (ev) => {
    if (ev.data?.target == 'comlink-init') self.shared = Comlink.wrap(ev.data.value);
});

async function serveFile(url) {
    if (!self.shared.xen.fs) return new Response(`Service not ready`, { status: 503 });

    const fsPath = new URL(url).pathname.replace(/^\/fs/, '');
    console.log(`${url}: ${fsPath}`);
    let content;

    try {
        content = await shared.xen.fs.read(fsPath);
    } catch (err) {
        return new Response(`File not found: ${fsPath}`, {
            status: 404,
            statusText: 'Not Found'
        });
    }

    const extension = fsPath.split('.').pop();
    const mime = (shared.mime && shared.mime.getType(extension)) || 'application/octet-stream';
    if (mime === 'video/mp2t') return new Response(content, { headers: { 'Content-Type': 'text/javascript' } });
    if (extension == 'css') return new Response(content, { headers: { 'Content-Type': 'text/css' } }); // ????????????

    return new Response(content, {
        headers: { 'Content-Type': mime },
    });
}

workbox.routing.registerRoute(
    /\/fs\//,
    async ({ request }) => {
        return await serveFile(request.url);
    },
    "GET"
);

importScripts("/libs/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/libs/uv/uv.sw.js");

const uv = new UVServiceWorker();
const methods = ["GET", "POST", "HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"];

methods.forEach((method) => {
    workbox.routing.registerRoute(/\/proxy\//,
        async (ev) => { return await uv.fetch(ev) },
        method);
});

async function init() {
    for (const client of await self.clients.matchAll()) {
        client.postMessage({
            target: "sw-reinit",
        });
    }
}

init();