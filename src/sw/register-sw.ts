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

export async function initSw() {
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