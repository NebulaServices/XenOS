import { Xen } from "./Xen";
import { XenTransport } from "./core/Transport";
import { oobe } from "./core/update";
import { bootSplash } from "./ui/bootSplash";
import { initSw } from "./sw/register-sw";

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

async function taskbar() {
    await window.xen.taskBar.loadPinnedEntries();
    window.xen.taskBar.render();
}

window.addEventListener('load', async () => {
    const splash = bootSplash();
    await setupDeps();

    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
        await reg.unregister();
    }

    await initSw();
    window.xen.wallpaper.set();
    await window.xen.boot();

    window.addEventListener('resize', () => {
        window.xen.wm.handleWindowResize();
    });

    const connection = new window.BareMux.BareMuxConnection('/libs/bare-mux/worker.js');
    //@ts-ignore
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