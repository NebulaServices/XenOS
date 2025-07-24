export class AnuraRepos {
    private url: string;

    constructor(url?: string) {
        if (url) {
            this.url = new URL(url).origin;
        }
    }

    setUrl(url: string) {
        this.url = new URL(url).origin;
    }

    async listPkgs() {
        const res = await window.xen.net.fetch(this.url + '/list.json');
        return await res.json();
    }

    async listApps() {
        const data = await this.listPkgs();
        return data.apps ?? [];
    }

    async listLibs() {
        const data = await this.listPkgs();
        return data.libs ?? [];
    }

    async install(type: 'name' | 'id', inp: string) {
        const data = await this.listPkgs();
        let match;

        if (type == 'id') {
            match = [...(data.apps ?? []), ...(data.libs ?? [])].find(
                (pkg) => pkg.package === inp
            );
        } else if (type == 'name') {
            match = [...(data.apps ?? []), ...(data.libs ?? [])].find(
                (pkg) => pkg.name === inp
            );
        }

        if (!match) throw new Error(`Package not found: ${inp}`);

        const url = this.url + '/' + match.data;
        await window.xen.ATL.package.install('url', url);
    }
}