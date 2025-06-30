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

async function serveFile(url, prefix, dir = '/') {
    if (!shared.xen) return new Response(`Service not ready`, { status: 503 });
    const path = new URL(url).pathname.replace(new RegExp(`^/${prefix}`), '');
    let content;

    try {
        content = await shared.xen.fs.read(dir + path);
    } catch (err) {
        return new Response(`File not found: ${path}`, {
            status: 404,
            statusText: 'Not Found'
        });
    }

    let mime = shared.mime.getType(path.split('.').pop()) || 'application/octet-stream';
    if (mime == 'video/mp2t') mime = 'text/javascript';

    return new Response(content, {
        headers: { 'Content-Type': mime, }
    });
}

workbox.routing.registerRoute(
    /\/fs\//,
    async ({ request }) => {
        return await serveFile(request.url, 'fs');
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