/// <reference lib="webworker" />
import { Shared } from "../types";

declare const Comlink: any;
declare const workbox: any;
declare let self: ServiceWorkerGlobalScope & {
    shared: Shared
}

// Firefox :frowning2:
Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: false,
});

importScripts(
    "/libs/comlink/umd/comlink.min.js",
    "/libs/workbox/workbox-sw.js",
    "/libs/uv/uv.bundle.js",
    "/uv/uv.config.js",
    "/libs/uv/uv.sw.js"
);

workbox.setConfig({
    debug: false,
    modulePathPrefix: "/libs/workbox",
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();

addEventListener('message', async (ev) => {
    if (ev.data?.target == 'comlink-init') {
        self.shared = Comlink.wrap(ev.data.value);
    }
});

let port: MessagePort | null = null;

async function serveFile(url: string): Promise<Response> {
    const fs = self.shared?.xen?.fs;
    const mime = self.shared?.mime;

    if (!fs) {
        return new Response("Service not ready", { status: 503 });
    }

    const path = new URL(url).pathname.replace(/^\/fs/, '');
    let content: Uint8Array;

        try {
            content = await fs.read(path, 'uint8array') as Uint8Array;
        } catch {
            return new Response(`File not found: ${path}`, {
                status: 404,
                statusText: 'Not Found',
            });
        }

    const extension = path.split('.').pop()?.toLowerCase() ?? '';
    let mimeType = await mime?.getType(extension) || 'application/octet-stream';

    return new Response(content, {
        headers: { 'Content-Type': mimeType },
    });
}


workbox.routing.registerRoute(
    /\/fs\//,
    async ({ request }) => {
        return await serveFile(request.url);
    },
    "GET"
);

//@ts-ignore
const uv = new UVServiceWorker();
const methods = ["GET", "POST", "HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"];

methods.forEach((method) => {
    workbox.routing.registerRoute(/\/proxy\//,
        async (ev: FetchEvent) => { return await uv.fetch(ev) },
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