import { Xen } from "./Xen";
import { XenTransport } from "./networking/Transport";

interface Shared {
    xen?: Xen;
    mime?: any;
}

let shared: Shared = {};

async function setupDeps() {
    const idbKvPath = '/libs/idb-keyval/index.js';
    const ComlinkPath = '/libs/comlink/esm/comlink.min.mjs';
    const mimePath = '/libs/mime/src/index.js'

    window.idbKv = await import(idbKvPath);
    window.Comlink = await import(ComlinkPath);
    window.mime = await import(mimePath);

    window.xen = new Xen();

    await window.xen.net.init();
    await window.xen.fs.init();
    await window.xen.init();

    shared.xen = window.xen;
    shared.mime = window.mime.default;
}

async function initComlink() {
    const { port1, port2 } = new MessageChannel();
    const msg = {
        target: 'comlink-init',
        value: port2
    };

    window.Comlink.expose(shared, port1);

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(msg, [port2]);
    } else {
        console.warn("SW controller not available, reloading");
        location.reload();
    }
}

async function initSw() {
    await navigator.serviceWorker.register('/sw.js');

    if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
            const onControllerChange = () => {
                navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
                resolve();
            };

            navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        });
    }

    await initComlink();

    navigator.serviceWorker.addEventListener('message', (ev) => {
        if (ev.data.target === 'sw-reinit') {
            initComlink();
        }
    });
}

window.addEventListener('load', async () => {
    await setupDeps();

    if (!localStorage.getItem('xen.fs.mirrored')) {
        await window.xen.mirror();
        localStorage.setItem('xen.fs.mirrored', 'true');
    }

    await initSw();

    const connection = new window.BareMux.BareMuxConnection('/libs/bare-mux/worker.js');
    connection.setRemoteTransport(new XenTransport(), 'XenTransport');
});
