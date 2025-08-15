export class KV {
    constructor(href) {
        this.hrefStore = href.split('/')[6]
    }

    init() {
        return new Promise((res, rej) => {
            const rq = indexedDB.open(this.name)
            rq.onerror = () => rej(rq.error)
            rq.onupgradeneeded = () => {
                const d = rq.result
                if (!d.objectStoreNames.contains(this.hrefStore)) {
                    d.createObjectStore(this.hrefStore)
                }
            }
            rq.onsuccess = () => {
                const d = rq.result
                if (d.objectStoreNames.contains(this.hrefStore)) {
                    res(d)
                } else {
                    const v2 = d.version + 1
                    d.close()
                    const rq2 = indexedDB.open(this.name, v2)
                    rq2.onerror = () => rej(rq2.error)
                    rq2.onupgradeneeded = () => {
                        rq2.result.createObjectStore(this.hrefStore)
                    }
                    rq2.onsuccess = () => res(rq2.result)
                }
            }
        })
    }

    async get(k) {
        const d = await this.init()
        return new Promise((res, rej) => {
            const r = d.transaction(this.hrefStore).objectStore(this.hrefStore).get(k)
            r.onerror = () => rej(r.error)
            r.onsuccess = () => res(r.result)
        })
    }

    async getAll() {
        const d = await this.init()
        return new Promise<Record<string, any>>((res, rej) => {
            const tx = d.transaction(this.hrefStore)
            const s = tx.objectStore(this.hrefStore)
            const rV = s.getAll()
            const rK = s.getAllKeys()
            let vs, ks;
            rV.onsuccess = () => (vs = rV.result)
            rK.onsuccess = () => (ks = rK.result)
            tx.oncomplete = () => {
                const o = {}
                ks.forEach((k, i) => (o[k] = vs[i]))
                res(o)
            }
            tx.onerror = () => rej(tx.error)
        })
    }

    async set(k, v) {
        const d = await this.init()
        return new Promise((res, rej) => {
            const r = d.transaction(this.hrefStore, 'readwrite')
                .objectStore(this.hrefStore)
                .put(v, k)
            r.onerror = () => rej(r.error)
            r.onsuccess = () => res()
        })
    }

    async remove(k) {
        const d = await this.init()
        return new Promise((res, rej) => {
            const r = d.transaction(this.hrefStore, 'readwrite')
                .objectStore(this.hrefStore)
                .delete(k)
            r.onerror = () => rej(r.error)
            r.onsuccess = () => res()
        })
    }
}