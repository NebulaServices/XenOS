document.addEventListener('DOMContentLoaded', () => {
    function main() {
        const wispText = document.getElementById('wisp-url');
        const saveBtn = document.getElementById('save-wisp-url');
        const updateBtn = document.getElementById('check-updates');
        const resetBtn = document.getElementById('reset-instance');

        saveBtn.addEventListener('click', async () => {
            const url = wispText.value;

            if (url) {
                const s = window.xen.settings.get('network-settings');
                s.url = url;

                window.xen.settings.set('network-settings', s);
                window.xen.net.setUrl(url);

                window.xen.notifications.spawn({
                    title: 'XenOS',
                    description: `Wisp URL set to: ${url}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            } else {
                const url = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
                const s = window.xen.settings.get('network-settings');
                s.url = url;

                window.xen.settings.set('network-settings', s);
                window.xen.net.setUrl(url);

                window.xen.notifications.spawn({
                    title: 'XenOS',
                    description: `Wisp URL set to: ${url}`,
                    icon: `/assets/logo.svg`,
                    timeout: 2500,
                });
            }
        });

        updateBtn.addEventListener('click', () => {
            window.xen.settings.remove('build-cache');
            location.reload();
        });

        resetBtn.addEventListener('click', async () => {
            window.xen.dialog
                .confirm({
                    title: 'XenOS',
                    body: 'Are you sure you would like to reset your instance? This will delete ALL of your files and settings.',
                })
                .then(async (res) => {
                    if (res === true) {
                        localStorage.removeItem('xen-settings');
                        await window.xen.fs.wipe();
                        await (
                            await navigator.serviceWorker.getRegistration()
                        ).unregister();
                        location.reload();
                    }
                });
        });
    }

    setTimeout(() => {
        main();
    }, 100);
});