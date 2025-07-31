import { Xen } from "./Xen";
import { XenTransport } from "./apis/networking/Transport";
import { oobe } from "./ui/oobe/autoUpdate";
import { bootSplash } from "./ui/bootSplash";

async function setupDeps() {
    const ComlinkPath = '/libs/comlink/esm/comlink.min.mjs';

    //@ts-ignore
    window.modules = {}
    window.modules.Comlink = await import(ComlinkPath);

    const xen = new Xen();
    window.xen = xen;

    await window.xen.net.init();
    await window.xen.fs.init();
    await window.xen.init();

    await oobe();

    window.shared = {};
    window.shared.xen = window.xen;
}

async function initComlink() {
    const { port1, port2 } = new MessageChannel();
    const msg = {
        target: 'comlink-init',
        value: port2
    };

    window.modules.Comlink.expose(window.shared, port1);

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(msg, [port2]);
    } else {
        console.warn("SW controller not available, reloading");
        location.reload();
    }
}

async function initSw() {
    await navigator.serviceWorker.register('/xen-sw.js');

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

async function taskbar() {
    await window.xen.taskBar.loadPinnedEntries();
    window.xen.taskBar.render();
}

window.addEventListener('load', async () => {
    const splash = bootSplash();

    await setupDeps();

    await initSw().then(() => {
        window.xen.wallpaper.set();
    });

    await window.xen.boot();

    window.addEventListener('resize', () => {
        window.xen.wm.handleWindowResize();
    });

    const loadingBar = document.getElementById("loading-bar") as HTMLDivElement;
    loadingBar.style.animation = "none";
    loadingBar.style.width = "100%";
    loadingBar.style.transition = "width 0.2s ease-out";

    const connection = new window.BareMux.BareMuxConnection('/libs/bare-mux/worker.js');
    connection.setRemoteTransport(new XenTransport(), 'XenTransport');

    setTimeout(() => {
        splash.style.opacity = "0";
        splash.addEventListener("transitionend", () => {
            splash.remove();
        });
    }, 600);

    await taskbar();
    await window.xen.initSystem();    
});

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'reload-site') {
            window.location.reload();
        }
    });
});

