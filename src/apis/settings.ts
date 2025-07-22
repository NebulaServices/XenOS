import { openDB, IDBPDatabase, StoreNames, StoreKey } from 'idb';

class KeyVal<T> {
    private dbName: string;
    private storeName: StoreNames<T>;
    private db: Promise<IDBPDatabase<T>>;

    constructor(dbName: string, storeName: StoreNames<T>) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = this.initDb();
    }

    private initDb(): Promise<IDBPDatabase<T>> {
        return openDB<T>(this.dbName, 1, {
            upgrade: (db) => {
                db.createObjectStore(this.storeName);
            },
        });
    }

    async get(key: StoreKey<T, StoreNames<T>>): Promise<any> {
        const db = await this.db;
        return db.get(this.storeName, key);
    }

    async getAll(): Promise<Record<string, any>> {
        const db = await this.db;
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const keys = await store.getAllKeys();
        const values = await store.getAll();

        return keys.reduce((acc: Record<string, any>, key, i) => {
            acc[key as string] = values[i];
            return acc;
        }, {});
    }

    async set(key: StoreKey<T, StoreNames<T>>, value: any): Promise<void> {
        const db = await this.db;
        await db.put(this.storeName, value, key);
    }

    async remove(key: StoreKey<T, StoreNames<T>>): Promise<void> {
        const db = await this.db;
        await db.delete(this.storeName, key);
    }
}

interface DBSchema {
    settings: {
        key: string;
        value: any;
    };
}

export const settings = new KeyVal<DBSchema>('xen-settings', 'settings');