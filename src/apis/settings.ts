export const settings = {
    get(key: string): any {
        const raw = localStorage.getItem("xen-settings");
        if (!raw) return undefined;

        try {
            const obj = JSON.parse(raw);
            return obj[key];
        } catch {
            return undefined;
        }
    },

    getAll() {
        return JSON.parse(localStorage.getItem('xen-settings'));
    },

    set(key: string, value: any): void {
        let obj: Record<string, any> = {};
        const raw = localStorage.getItem("xen-settings");

        if (raw) {
            try {
                obj = JSON.parse(raw);
            } catch {
                obj = {};
            }
        }

        obj[key] = value;
        localStorage.setItem("xen-settings", JSON.stringify(obj));
    },

    remove(key: string): void {
        const raw = localStorage.getItem("xen-settings");
        if (!raw) return;

        try {
            const obj = JSON.parse(raw);

            delete obj[key];
            localStorage.setItem("xen-settings", JSON.stringify(obj));
        } catch {}
    }
};
