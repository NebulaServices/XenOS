const idb = require('idb');

const default_config = {
  xen: {
    user: {
      'hello.txt': 3
    }
  },
  system: {
    '__DOCK_PINS.xen': 0,
    '__START_PINS.xen': 1,
    'system.xen': 2
  }
}

class VFS {
  constructor() {
  }

  async start() {
    this.db = await this.open();

    return true;
  }

  async open() {
    const db = await idb.openDB('xen-fs', 1, {
      upgrade(db) {
        db.createObjectStore('main');
        db.createObjectStore('files')

        const store = await db.transaction('main', 'readwrite').objectStore('main');

        store.put(default_config);

        const store2 = await db.transaction('files', 'readwrite').objectStore('files');

        
      },
    });
  }
}

window.__XEN_WEBPACK.core.VFS = VFS;