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

    navigator.serviceWorker.addEventListener('message', async (ev) => {
        if (ev.data.target === 'sw-reinit') {
            initComlink();
        }

        if (ev.data?.target === 'show-file-picker') {
            const { options } = ev.data;

            try {
                const result = await window.xen.FilePicker.pick({
                    title: options.type === 'folder' ? 'Select Folder' : 'Select File',
                    multiple: options.multiple,
                    mode: options.mode
                });

                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        target: 'file-picker-response',
                        result
                    });
                } else {
                    console.error('No SW controller');
                }
            } catch (error) {
                console.error('File picker error:', error);
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        target: 'file-picker-response',
                        result: null,
                        error: error.message
                    });
                }
            }
        }
    });
}