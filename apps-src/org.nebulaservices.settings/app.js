document.addEventListener('DOMContentLoaded', () => {
    function main() {
        const wispUrl = document.getElementById('wisp-url');
        const saveWispBtn = document.getElementById('save-wisp-url');
        const updateBtn = document.getElementById('check-updates');
        const resetBtn = document.getElementById('reset-instance');

        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');

        try {
            const settings = window.xen.settings.get('network-settings');

            if (settings && settings.url) {
                wispUrl.value = settings.url;
            }
        } catch (e) {
            console.error('Failed to load Wisp URL:', e);
        }

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const id = item.dataset.section + '-section';

                navItems.forEach((nav) => nav.classList.remove('active'));
                item.classList.add('active');

                sections.forEach((section) => {
                    if (section.id === id) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
            });
        });

        saveWispBtn.addEventListener('click', async () => {
            const url = wispUrl.value.trim();

            if (url) {
                try {
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
                } catch (e) {
                    console.error('Error setting Wisp URL:', e);

                    window.xen.notifications.spawn({
                        title: 'XenOS',
                        description: `Failed to set Wisp URL: ${e.message}`,
                        icon: `/assets/logo.svg`,
                        timeout: 3000,
                    });
                }
            } else {
                const defaultUrl =
                    (location.protocol === 'https:' ? 'wss' : 'ws') +
                    '://' +
                    location.host +
                    '/wisp/';
                try {
                    const s = window.xen.settings.get('network-settings');
                    s.url = defaultUrl;

                    window.xen.settings.set('network-settings', s);
                    window.xen.net.setUrl(defaultUrl);

                    wispUrl.value = defaultUrl;

                    window.xen.notifications.spawn({
                        title: 'XenOS',
                        description: `Wisp URL reset to default: ${defaultUrl}`,
                        icon: `/assets/logo.svg`,
                        timeout: 2500,
                    });
                } catch (e) {
                    console.error('Error resetting Wisp URL to default:', e);

                    window.xen.notifications.spawn({
                        title: 'XenOS',
                        description: `Failed to reset Wisp URL to default: ${e.message}`,
                        icon: `/assets/logo.svg`,
                        timeout: 3000,
                    });
                }
            }
        });

        updateBtn.addEventListener('click', async () => {
            try {
                window.xen.settings.remove('build-cache');
                window.parent.postMessage({ type: 'reload-site' }, '*');
            } catch (e) {
                console.error('Error checking for updates:', e);
                window.xen.notifications.spawn({
                    title: 'XenOS',
                    description: `Failed to check for updates: ${e.message}`,
                    icon: `/assets/logo.svg`,
                    timeout: 3000,
                });
            }
        });

        resetBtn.addEventListener('click', async () => {
            await window.xen.dialog
                .confirm({
                    title: 'XenOS',
                    body: 'Are you sure you would like to reset your instance? This will delete ALL of your files and settings.',
                })
                .then(async (res) => {
                    if (res === true) {
                        try {
                            localStorage.removeItem('xen-settings');
                            await window.xen.fs.wipe();
                            const registration =
                                await navigator.serviceWorker.getRegistration();
                            if (registration) {
                                await registration.unregister();
                            }
                            window.parent.postMessage(
                                { type: 'reload-site' },
                                '*',
                            );
                        } catch (e) {
                            console.error('Error resetting instance:', e);
                            window.xen.notifications.spawn({
                                title: 'XenOS',
                                description: `Failed to reset instance: ${e.message}`,
                                icon: `/assets/logo.svg`,
                                timeout: 3000,
                            });
                        }
                    }
                });
        });

        document.querySelector('.nav-item.active').click();
    }

    setTimeout(() => {
        main();
    }, 100);
});