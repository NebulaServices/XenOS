export class Wallpaper {
    public async upload(type: 'url' | 'prompt', url?: string) {
        let finalUrl: string | undefined;

        if (type === 'url' && url) {
            finalUrl = window.xen.net.encodeUrl(url);
        } else if (type === 'prompt') {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{ accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } }],
            });
    
            const file = await fileHandle.getFile();
            const path = `/usr/wallpapers/${file.name}`;

            await window.xen.fs.write(path, file);
            finalUrl = `/fs${path}`;
        }

        if (finalUrl) {
            window.xen.settings.set('wallpaper', finalUrl);
            this.update();
        }
    }

    public async set(filename?: string) {
        let final: string | null = null;

        if (filename) {
            final = `/fs/usr/wallpapers/${filename}`;
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

    public async remove(file?: string) {
        if (file) {
            await window.xen.fs.rm(`/usr/wallpapers/${file}`);
        }
    
        window.xen.settings.remove('wallpaper');
        this.set();
    }

    public async default() {
        const defualtWP = '/assets/wallpaper.webp';
        const target = '/usr/wallpapers/default.webp';

        try {
            await window.xen.fs.read(target);
        } catch {
            const response = await fetch(defualtWP);
            const blob = await response.blob();

            await window.xen.fs.write(target, blob);
        }

        window.xen.settings.set('wallpaper', `/fs${target}`);
        this.update();
    }

    public async list() {
        return await window.xen.fs.list('/usr/wallpapers');
    }

    private async update() {
        const url = await this.get();

        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundImage = url ? `url("${url}")` : '';
    }
}