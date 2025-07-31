import { Xen } from "./Xen";
import { XenTransport } from "./apis/networking/Transport";
import { oobe } from "./ui/oobe/autoUpdate";
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

