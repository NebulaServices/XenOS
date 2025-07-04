export class Wallpaper {
    constructor() {
        this.set();
    }

    public set(url?: string) {
        let final = url;

        if (!final) {
            final = this.get();

            if (!final) {
                final = '/wallpaper.webp';
                localStorage.setItem('XEN-WALLPAPER', final);
            }
        } else {
            localStorage.setItem('XEN-WALLPAPER', final);
        }

        this.update();
    }

    public get(): string | null {
        return localStorage.getItem('XEN-WALLPAPER');
    }

    public remove() {
        localStorage.removeItem('XEN-WALLPAPER');
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
