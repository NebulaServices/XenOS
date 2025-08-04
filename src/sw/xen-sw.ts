/// <reference lib="webworker" />
import { Shared } from "../types";
import * as mime from 'mime';

declare const Comlink: any;
declare const workbox: any;
declare let self: ServiceWorkerGlobalScope & {
    shared: Shared
    pfpr: Map<string, any>;
}

self.pfpr = new Map();

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
    let mimeType = await mime.default.getType(extension) || 'application/octet-stream';

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

workbox.routing.registerRoute(
    "/dnt",
    async () => {
        return new Response("OK");
    },
    "GET"
);

//@ts-ignore
const uv = new UVServiceWorker();
const methods = ["GET", "POST", "HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"];

methods.forEach((method) => {
    workbox.routing.registerRoute(/\/uvp\//,
        async (ev: FetchEvent) => {
            return await uv.fetch(ev)
        },
        method);
});

// https://github.com/MercuryWorkshop/anuraOS/blob/main/public/anura-sw.js
const webDAVMethods = [
    "OPTIONS",
    "PROPFIND",
    "PROPPATCH",
    "MKCOL",
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "DELETE",
    "COPY",
    "MOVE",
    "LOCK",
    "UNLOCK",
];

async function handleDavRequest({ request, url }) {
    const fs = self.shared?.xen?.fs;

    if (!fs) {
        return new Response("Service not ready", { status: 503 });
    }

    const method = request.method;
    const path = decodeURIComponent(url.pathname.replace(/^\/dav/, "") || "/");

    const getBuffer = async () => new Uint8Array(await request.arrayBuffer());
    const getDestPath = () => {
        return decodeURIComponent(
            new URL(request.headers.get("Destination")!, url)
                .pathname.replace(/^\/dav/, "")
        );
    }

    try {
        switch (method) {
            case "OPTIONS":
                return new Response(null, {
                    status: 204,
                    headers: {
                        Allow:
                            "OPTIONS, PROPFIND, PROPPATCH, MKCOL, GET, HEAD, POST, PUT, DELETE, COPY, MOVE, LOCK, UNLOCK",
                        DAV: "1, 2",
                    },
                });

            case "PROPFIND":
                try {
                    const stats = await fs.stat(path);
                    const isDir = stats.isDirectory == true;
                    const href = url.pathname;
                    let responses = "";

                    console.log(stats);
                    console.log(isDir);
                    console.log(href);

                    const renderEntry = async (entryPath, stat) => {
                        const isDir2 = stat.isDirectory == true;
                        const contentLength = isDir2 ? "" : `<a:getcontentlength b:dt="int">${stat.size}</a:getcontentlength>`;
                        const contentType = isDir2 ? "" : `<a:getcontenttype>${stat.mime}</a:getcontenttype>`;
                        const creationDate = new Date(stat.lastModified).toISOString();
                        const lastModified = new Date(stat.lastModified).toUTCString();
                        const resourcetype = isDir2 ? "<a:collection/>" : "";

                        console.log(isDir2);
                        console.log(contentLength);
                        console.log(contentType);
                        console.log(creationDate);
                        console.log(lastModified);
                        console.log(resourcetype);

                        return `
                <a:response>
                    <a:href>${entryPath}</a:href>
                    <a:propstat>
                        <a:status>HTTP/1.1 200 OK</a:status>
                        <a:prop>
                            <a:resourcetype>${resourcetype}</a:resourcetype>
                            ${contentLength}
                            ${contentType}
                            <a:creationdate>${creationDate}</a:creationdate>
                            <a:getlastmodified>${lastModified}</a:getlastmodified>
                        </a:prop>
                    </a:propstat>
                </a:response>
            `;
                    };

                    if (isDir) {
                        responses = await renderEntry(
                            href.endsWith("/") ? href : href + "/",
                            stats
                        );

                        const entries = await fs.list(path);
                        const files = entries.map(e => e.name);

                        const fileResponses = await Promise.all(
                            files.map(async (file) => {
                                const fullPath = path.endsWith("/") ? path + file : `${path}/${file}`;
                                const stat = await fs.stat(fullPath);
                                const entryHref = `${href.endsWith("/") ? href : href + "/"}${file}`;
                                return renderEntry(entryHref, stat);
                            })
                        );
                        responses += fileResponses.join("");
                    } else {
                        responses = await renderEntry(href, stats);
                    }

                    const xml = `
            <?xml version="1.0"?>
            <a:multistatus xmlns:a="DAV:" xmlns:b="urn:uuid:c2f41010-65b3-11d1-a29f-00aa00c14882/">
                ${responses}
            </a:multistatus>
        `.trim();

                    return new Response(xml, {
                        headers: { "Content-Type": "application/xml" },
                        status: 207
                    });
                } catch (err) {
                    console.error(path, err);
                    const xml = `
            <?xml version="1.0"?>
            <a:multistatus xmlns:a="DAV:">
                <a:response>
                    <a:href>${url.pathname}</a:href>
                    <a:status>HTTP/1.1 404 Not Found</a:status>
                </a:response>
            </a:multistatus>
        `.trim();
                    return new Response(xml, {
                        headers: { "Content-Type": "application/xml" },
                        status: 207
                    });
                }

            case "PROPPATCH":
                return new Response(null, { status: 207 }); // No-op

            case "MKCOL":
                try {
                    await fs.mkdir(path);
                    return new Response(null, { status: 201 });
                } catch {
                    return new Response(null, { status: 405 });
                }

            case "GET":
            case "HEAD":
                try {
                    const data = await fs.read(path, 'blob');
                    const stat = await fs.stat(path);
                    return new Response(method === "HEAD" ? null : data, {
                        headers: {
                            "Content-Type": stat.mime
                        },
                        status: 200
                    });
                } catch {
                    return new Response(null, { status: 404 });
                }

            case "PUT": {
                try {
                    const buffer = await getBuffer();
                    await fs.write(path, buffer.buffer);
                    return new Response(null, { status: 201 });
                } catch {
                    return new Response(null, { status: 500 });
                }
            }

            case "DELETE":
                try {
                    await fs.rm(path);
                    return new Response(null, { status: 204 });
                } catch {
                    return new Response(null, { status: 404 });
                }

            case "COPY": {
                const dest = getDestPath();

                try {
                    //@ts-ignore
                    await fs.copy(path, dest);
                    return new Response(null, { status: 201 });
                } catch (e) {
                    console.error(e);
                    return new Response(null, { status: 404 });
                }
            }

            case "MOVE": {
                const dest = getDestPath();

                try {
                    //@ts-ignore
                    await fs.move(path, dest);
                } catch {
                    return new Response(null, { status: 500 });
                }
            }

            case "LOCK":
            case "UNLOCK": {
                return new Response(
                    `<?xml version="1.0"?><d:prop xmlns:d="DAV:"><d:lockdiscovery/></d:prop>`,
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/xml",
                            "Lock-Token": `<opaquelocktoken:fake-lock-${Date.now()}>`,
                        },
                    },
                );
            }

            case "POST":
                return new Response("POST not implemented", { status: 204 });

            default:
                return new Response("Unsupported WebDAV method", { status: 405 });
        }
    } catch (err) {
        return new Response(`Internal error: ${err.message}`, { status: 500 });
    }
}

for (const method of webDAVMethods) {
    workbox.routing.registerRoute(
        /\/dav/,
        async (event) => {
            return await handleDavRequest(event);
        },
        method,
    );
}

workbox.routing.registerRoute(
    /\/showFilePicker/,
    async ({ url }) => {
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
    },
    'GET'
);

async function init() {
    for (const client of await self.clients.matchAll()) {
        client.postMessage({
            target: "sw-reinit",
        });
    }
}

init();
