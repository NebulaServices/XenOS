export class KV {
    private name = 'xen-kv'
    private hrefStore: string
    private db: IDBDatabase | null = null

    constructor(href: string) {
        this.hrefStore = href.split('/')[6]
    }

    private init(): Promise<IDBDatabase> {
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

    async get(k: string) {
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
            let vs: any[], ks: IDBValidKey[]
            rV.onsuccess = () => (vs = rV.result)
            rK.onsuccess = () => (ks = rK.result)
            tx.oncomplete = () => {
                const o: Record<string, any> = {}
                ks.forEach((k, i) => (o[k as string] = vs[i]))
                res(o)
            }
            tx.onerror = () => rej(tx.error)
        })
    }

    async set(k: string, v: any) {
        const d = await this.init()
        return new Promise<void>((res, rej) => {
            const r = d.transaction(this.hrefStore, 'readwrite')
                .objectStore(this.hrefStore)
                .put(v, k)
            r.onerror = () => rej(r.error)
            r.onsuccess = () => res()
        })
    }

    async remove(k: string) {
        const d = await this.init()
        return new Promise<void>((res, rej) => {
            const r = d.transaction(this.hrefStore, 'readwrite')
                .objectStore(this.hrefStore)
                .delete(k)
            r.onerror = () => rej(r.error)
            r.onsuccess = () => res()
        })
    }
}