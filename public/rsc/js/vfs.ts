// @ts-nocheck

function openAsync(...args) {
	return new Promise(async resolve => {
		var req = indexedDB.open(args[0]);
		req.onupgradeneeded = async function (event) {
			await createObject(event.target.result);
			if (args[1]) return resolve([req, event]);
		};
		req.onsuccess = function (event) {
			if (!args[1]) return resolve([req, event]);
		};
	});
}

function createObject(db) {
	return new Promise(async resolve => {
		var req = db.createObjectStore("main", {
			keyPath: "id",
			autoIncrement: true,
		});
		return resolve(req);
	});
}

function saveFile(db, file, content) {
	return new Promise(async resolve => {
      try {
        async function iterate() {
          await remove(file);
          await iterate();
        }
        await iterate();
      } catch(e) {};
			
      db
				.transaction("main", "readwrite")
				.objectStore("main")
				.add({ key: file, body: content, dir: '/' })
        .onsuccess = function() {resolve()};
	});
}

function getObject(db) {
	return new Promise(async resolve => {
		return resolve(db.transaction("main", "readwrite").objectStore("main"));
	});
}

function getAll(db) {
	return new Promise(async resolve => {
		var req = db.getAll();
		req.onsuccess = function () {
			return resolve(req.result);
		};
	});
}

function deleteObj(db, name) {
	return new Promise(async resolve => {
		var req = db.delete(name);

		req.onsuccess = function () {
			return resolve(true);
		};
	});
}

async function save(name, content) {
	var [db, event] = await openAsync("db-fs", false);

	var all = await getAll(await getObject(db.result));

	//if (all.find(e => e.key == name)) return console.log("abort save");

  try {
    async function iterate() {
      await remove(name);
      await iterate();
    }
    await iterate();
  } catch(e) {};

	var obj = await saveFile(event.target.result, name, content);

	return true;
}

async function get(file) {
	var [db, event] = await openAsync("db-fs", false);

	var obj = await getObject(db.result);

	var all = await getAll(obj);

  console.log(all);

  try {
	  return all.find(e => e.key == file).body;
  } catch(e) {
    return new Error({message: 'not found'})
  }
}

async function remove(file) {
	var [db, event] = await openAsync("db-fs", false);

	var obj = await getObject(db.result);

	var all = await getAll(obj);
  console.log(all.find(e => e.key == file));
  console.log(all);
	var done = await deleteObj(obj, all.find(e => e.key == file).id);

	return true;
}

async function space(detailed = true) {
	var data = await navigator.storage.estimate();

	return {
		max: data.quota,
		totalUse: data.usage,
		idb: data.usageDetails.indexedDB,
		percent: data.usage / data.quota,
	};
}

async function exists(file) {
	var [db, event] = await openAsync("db-fs", false);

	var obj = await getObject(db.result);

	var all = await getAll(obj);

	return all.find(e => e.key == file) ? true : false;
}

async function readdir(dir) {
	var [db, event] = await openAsync("db-fs", false);

	var obj = await getObject(db.result);

	var all = await getAll(obj);

	return all.filter(e=>e.dir==dir).map(e=>e.key);
}

function getDir(name) {
	return new Promise(async resolve => {
    var db = await openAsync('db-fs', false);
		var obj = await getObject(db);
		var all = await getAll(obj);
		var data = {};

		all.forEach(({ key }) => {
			if (!key.startsWith(name)) return;
			if (key.split("/").length > 1) {
				var split = key.split("/")[0];
				data[split] = [];
				console.log(data);
			}
		});

		resolve(data);
	});
}

class VFS {
	constructor() {}

	exists = exists;
	writeFile = save;
	readFile = async function (file, json) {
		return json ? JSON.parse(await get(file)) : await get(file);
	};
  readdir = readdir;
	getStorageData = space;
	removeFile = remove;
  dir = getDir
};

class Directory extends VFS {
  constructor(files) {
    super();

    this.getStorageData = null;
  }
}

window.__XEN_WEBPACK.core.VFS = VFS;
