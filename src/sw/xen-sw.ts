/// <reference lib="webworker" />
import { getOpfsRoot, download, preCache } from "./bootstrap";
import { Shared } from "../types";
import { handleDavRequest } from "./webdav";
import * as mime from "mime";

declare const Comlink: any;
declare const UVServiceWorker: any;
declare let self: ServiceWorkerGlobalScope & {
    shared: Shared;
    pfpr: Map<string, any>;
};

self.pfpr = new Map();

Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: false
});

importScripts(
    "/libs/comlink/umd/comlink.min.js",
    "/libs/uv/uv.bundle.js",
    "/uv/uv.config.js",
    "/libs/uv/uv.sw.js"
);

async function checkBs() {
    return new Promise((resolve) => {
        const req = indexedDB.open("xen-shared", 1);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("opts")) {
                db.createObjectStore("opts", { keyPath: "key" });
            }
        };

        req.onsuccess = (e: Event) => {
            const db = (e.target as IDBOpenDBRequest).result;

            try {
                const tx = db.transaction("opts", "readonly");
                const store = tx.objectStore("opts");
                const req = store.get("bootstrap-fs");

                req.onsuccess = () => {
                    resolve(req.result ? req.result.value : null);
                };

                req.onerror = () => {
                    resolve(null);
                };
            } catch (error) {
                resolve(null);
            }
        };

        req.onerror = () => {
            resolve(null);
        };
    });
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            try {
                const s = await checkBs();
                if (s != 'false') {
                    await preCache();
                }
            } catch (err) {
                console.warn('Bootstrap check or preCache failed:', err);
            }
        })()
    );

    self.skipWaiting();
});

self.addEventListener("activate", () => {
    self.clients.claim();
});

addEventListener("message", async (ev) => {
    if (ev.data?.target === "comlink-init") {
        self.shared = Comlink.wrap(ev.data.value);
    } else if (ev.data?.target === "file-picker-response") {
        const { result, error } = ev.data;
        const resolve = self.pfpr.get("PENDING");

        self.pfpr.delete("PENDING");

        if (error) {
            resolve(
                new Response(JSON.stringify({ error }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                })
            );
            return;
        }

        if (result) {
            resolve(
                new Response(JSON.stringify({ result }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                })
            );
        }
    }
});

async function serveOPFS(url: string): Promise<Response> {
    const root = await getOpfsRoot();
    const path = new URL(url).pathname.replace(/^\/fs/, "");

    try {
        const parts = path.split("/").filter((p) => p.length > 0);
        const fileName = parts.pop();
        let currentDir = root;

        for (const part of parts) {
            currentDir = await currentDir.getDirectoryHandle(part);
        }

        const fileHandle = await currentDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        let mimeType =
            file.type ||
            mime.default.getType(fileName.split(".").pop() || "") ||
            "application/octet-stream";

        return new Response(file, {
            status: 200,
            headers: { "Content-Type": mimeType }
        });
    } catch {
        return new Response(`File not found: ${path}`, {
            status: 404,
            statusText: "Not Found"
        });
    }
}

async function handleShowFilePicker(url: URL): Promise<Response> {
    let id = crypto.randomUUID();
    let clients = (await self.clients.matchAll()).filter(
        (v) => new URL(v.url).pathname === "/"
    );

    if (clients.length < 1) {
        return new Response("no clients were available to take your request");
    }

    let client = clients[0];
    const multiple = url.searchParams.get("multiple") === "true";
    let type = url.searchParams.get("type") || "file";

    return new Promise((resolve) => {
        self.pfpr.set("PENDING", resolve);

        client.postMessage({
            target: "show-file-picker",
            id,
            options: {
                type,
                multiple,
                mode: type === "folder" ? "directory" : "file"
            }
        });
    });
}

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/uvp/")) {
        //@ts-ignore
        const uv = new UVServiceWorker();
        event.respondWith(uv.fetch(event));
        return;
    }

    if (pathname.startsWith("/fs/")) {
        event.respondWith(serveOPFS(event.request.url));
        return;
    }

    if (pathname.startsWith("/showFilePicker")) {
        event.respondWith(handleShowFilePicker(url));
        return;
    }

    if (pathname.startsWith("/dav/")) {
        event.respondWith(handleDavRequest(event.request, url));
        return;
    }

    event.respondWith(
        (async () => {
            if (url.origin !== self.location.origin) {
                return fetch(event.request);
            }

            let localPath = pathname === "/" ? "/index.html" : pathname;
            const root = await getOpfsRoot();
            const opfsPath = `system${localPath}`;

            try {
                const parts = opfsPath.split("/").filter((p) => p.length > 0);
                const fileName = parts.pop();
                let currentDir = root;

                for (const part of parts) {
                    currentDir = await currentDir.getDirectoryHandle(part);
                }

                const fileHandle = await currentDir.getFileHandle(fileName);
                const file = await fileHandle.getFile();

                return new Response(file, {
                    status: 200,
                    headers: {
                        "Content-Type": file.type || "application/octet-stream"
                    }
                });
            } catch {
                const response = await fetch(localPath);
                if (!response.ok) return response;

                try {
                    const s = await checkBs();
                    if (s != 'false') await download(localPath, response.clone());
                } catch (err) {
                    console.warn('Bootstrap check or download failed:', err);
                }

                return response;
            }
        })()
    );
});

async function init() {
    for (const client of await self.clients.matchAll()) {
        client.postMessage({
            target: "sw-reinit"
        });
    }
}

init();