import { Xen } from "./Xen";
import { XenTransport } from "./core/Transport";
import { update } from "./core/update";
import { bootSplash } from "./ui/bootSplash";
import { initSw } from "./sw/register-sw";

let DEBUG: boolean = false;

async function parseArgs() {
    const args = new URLSearchParams(window.location.search);

    if (args.get('debug') === 'true') {
        DEBUG = true;
    }

    if (localStorage.getItem('checked') === 'true') {
        return;
    }

    if (args.get('bootstrap-fs') == 'false') {
        const req = indexedDB.open('xen-shared', 1);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("opts")) {
                db.createObjectStore("opts", { keyPath: "key" });
            }
        };

        req.onsuccess = (e: Event) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tx = db.transaction("opts", "readwrite");
            const store = tx.objectStore("opts");

            store.put({ key: "bootstrap-fs", value: "false" });
        };

        localStorage.setItem('checked', 'true');
    }
}

async function setupXen() {
    const ComlinkPath = '/libs/comlink/esm/comlink.min.mjs';

    //@ts-ignore
    window.modules = {}
    window.modules.Comlink = await import(ComlinkPath);

    const xen = new Xen();
    window.xen = xen;

    await window.xen.net.init();
    await window.xen.p2p.init();
    await window.xen.vfs.init();
    window.xen.repos.init();
    await window.xen.init();

    window.shared = {};
    window.shared.xen = window.xen;
}

async function isOobe() {
    if (!window.xen.settings.get('oobe')) {
        await update();

        window.xen.settings.set('oobe', true);
        window.xen.settings.set('build-cache', window.xen.version.build);

        location.reload();
    }
}

async function createSw() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
        await reg.unregister();
    }
    await initSw();
}

function createTransport() {
    const connection = new window.BareMux.BareMuxConnection('/libs/bare-mux/worker.js');
    //@ts-ignore
    connection.setRemoteTransport(new XenTransport(), 'XenTransport');
}

async function uiInit() {
    window.xen.wallpaper.set();

    window.addEventListener('resize', () => {
        window.xen.wm.handleWindowResize();
    });

    window.xen.taskBar.init();
    window.xen.taskBar.create();
    window.xen.taskBar.appLauncher.init();

    window.xen.wm.onCreated = () => window.xen.taskBar.onWindowCreated();
    window.xen.wm.onClosed = () => window.xen.taskBar.onWindowClosed();

    await window.xen.taskBar.loadPinnedEntries();
    window.xen.taskBar.render();
}

window.addEventListener('load', async () => {
    const splash = bootSplash();
    (window as any).bootSplash = splash;

    parseArgs();
    await setupXen();
    await isOobe();
    await createSw();
    createTransport();
    await window.xen.initSystem();
    await uiInit();

    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    setTimeout(() => {
        splash.element.style.opacity = "0";
        splash.element.addEventListener("transitionend", () => {
            splash.element.remove();
        });
    }, 600);

    if (DEBUG == true) {
        //@ts-ignore
        window.ChiiDevtoolsIframe = window.xen.wm.create({ url: 'https://example.com' }).el.content;

        const pm = window.postMessage;
        window.postMessage = (msg, origin) => {
            pm.call(window, msg, origin);
        };

        const script = document.createElement('script');
        script.src = '/chii/target.js';
        script.setAttribute('embedded', 'true');
        document.body.appendChild(script);
    }
});