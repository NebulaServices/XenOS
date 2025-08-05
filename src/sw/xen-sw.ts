/// <reference lib="webworker" />
import { Shared } from "../types";
import { CACHE_NAME, PRECACHE_RESOURCES } from "./cache";
import { handleDavRequest } from "./webdav";
import * as mime from 'mime';

declare const Comlink: any;
declare const UVServiceWorker: any;
declare let self: ServiceWorkerGlobalScope & {
    shared: Shared
    pfpr: Map<string, any>;
}

self.pfpr = new Map();

const SW_ROUTES = ['/uvp/', '/fs/', '/showFilePicker', '/dav/', '/cc'];

// Firefox :frowning2:
Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: false,
});

importScripts(
    "/libs/comlink/umd/comlink.min.js",
    "/libs/uv/uv.bundle.js",
    "/uv/uv.config.js",
    "/libs/uv/uv.sw.js"
);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_RESOURCES);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

addEventListener('message', async (ev) => {
    if (ev.data?.target === 'comlink-init') {
        self.shared = Comlink.wrap(ev.data.value);
    } else if (ev.data?.target === 'file-picker-response') {
        const { result, error } = ev.data;
        const resolve = self.pfpr.get('PENDING');

        self.pfpr.delete('PENDING');

        if (error) {
            resolve(new Response(JSON.stringify({ error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }));

            return;
        }

        if (result) {
            resolve(new Response(JSON.stringify({ result }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
    }
});

async function serveFile(url: string): Promise<Response> {
    const fs = self.shared?.xen?.fs;

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
    let mimeType = mime.default.getType(extension) || 'application/octet-stream';

    return new Response(content, {
        headers: { 'Content-Type': mimeType },
    });
}

async function handleShowFilePicker(url: URL): Promise<Response> {
    let id = crypto.randomUUID();
    let clients = (await self.clients.matchAll()).filter(
        (v) => new URL(v.url).pathname === "/",
    );

    if (clients.length < 1)
        return new Response("no clients were available to take your request");

    let client = clients[0];
    const multiple = url.searchParams.get('multiple') === 'true';
    let type = url.searchParams.get("type") || "file";

    return new Promise((resolve) => {
        self.pfpr.set('PENDING', resolve);
        client.postMessage({
            target: 'show-file-picker',
            id,
            options: {
                type,
                multiple,
                mode: type === 'folder' ? 'directory' : 'file'
            }
        });
    });
}

function isSwRoute(pathname: string): boolean {
    return SW_ROUTES.some(route => pathname.startsWith(route));
}

async function cacheResource(request: Request, response: Response): Promise<void> {
    if (response.status === 200 && !isSwRoute(new URL(request.url).pathname)) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (!cachedResponse) {;
            await cache.put(request, response);
        }
    }
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const pathname = url.pathname;

    // Clear cache
    if (pathname === '/cc') {
        event.respondWith(
            caches.delete(CACHE_NAME).then(() => {
                return new Response('Cache cleared', { status: 200 });
            })
        );
        return;
    }

    // Ultraviolet
    if (pathname.startsWith('/uvp/')) {
        //@ts-ignore
        const uv = new UVServiceWorker();
        event.respondWith(uv.fetch(event));
        return;
    }

    // FS
    if (pathname.startsWith('/fs/')) {
        event.respondWith(serveFile(event.request.url));
        return;
    }

    // Only for VSCode
    if (pathname.startsWith('/showFilePicker')) {
        event.respondWith(handleShowFilePicker(url));
        return;
    }

    // WebDAV
    if (pathname.startsWith('/dav/')) {
        event.respondWith(handleDavRequest(event.request, url));
        return;
    }

    // Cache-first
    event.respondWith(
        caches.match(event.request).then((res) => {
            if (res) {
                return res;
            }

            return fetch(event.request).then((res) => {
                const resC = res.clone();
                cacheResource(event.request, resC);
                return res;
            }).catch(() => {
                console.log('Offline - resource not in cache:', event.request.url);
                return new Response('Resource not available offline', { 
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

async function init() {
    for (const client of await self.clients.matchAll()) {
        client.postMessage({
            target: "sw-reinit",
        });
    }
}

init();
