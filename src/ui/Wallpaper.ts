export class Wallpaper {
    public set(url?: string) {
        let final = url;

        if (!final) {
            final = this.get();

            if (!final) {
                final = '/wallpaper.webp';
                window.xen.settings.set('wallpaper', final);
            }
        } else {
            window.xen.settings.set('wallpaper', final);
        }

        this.update();
    }

    public get(): string | null {
        return window.xen.settings.get('wallpaper');
    }

    public remove() {
        window.xen.settings.remove('wallpaper');
        this.set();
    }

    private update() {
        const url = this.get();
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundImage = url ? `url("${url}")` : '';
    }
}
