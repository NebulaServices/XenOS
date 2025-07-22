export class Wallpaper {
    public async set(url?: string, type: 'url' | 'opfs' = 'url') {
        let final: string | null = null;

        if (url) {
            if (type === 'opfs') {
                final = '/fs/' + url;
            } else if (type === 'url') {
                final = window.xen.net.encodeUrl(url);
            }
        }

        if (!final) {
            final = await this.get();

            if (!final) {
                final = '/assets/wallpaper.webp';
                window.xen.settings.set('wallpaper', final);
            }
        } else {
            window.xen.settings.set('wallpaper', final);
        }

        this.update();
    }

    public async get(): Promise<string | null> {
        return window.xen.settings.get('wallpaper');
    }

    public async remove() {
        window.xen.settings.remove('wallpaper');
        this.set();
    }

    private async update() {
        const url = await this.get();
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundImage = url ? `url("${url}")` : '';
    }
}
