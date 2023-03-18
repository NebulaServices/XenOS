// @ts-nocheck

function openAsync(...args) {
	return new Promise(async resolve => {
		var req = indexedDB.open(args[0]);
		req.onupgradeneeded = async e => {
			await createObject(e.target.result);
			if (args[1]) return resolve([req, e]);
		};
		req.onsuccess = e => {
			if (!args[1]) return resolve([req, e]);
		};
	});
}

function createObject(db) {
	return new Promise(async resolve => {
		const req = db.createObjectStore("main", {
			keyPath: "id",
			autoIncrement: true,
		});
		return resolve(req);
	});
}

function saveFile(db, file, content) {
	return new Promise(async resolve => {
		try {
			await remove(file);
		} finally {
		}

		db
			.transaction("main", "readwrite")
			.objectStore("main")
			.add({ key: file, body: content, dir: "/" }).onsuccess = () =>
			resolve();
	});
}

function getObject(db) {
	return new Promise(async resolve =>
		resolve(db.transaction("main", "readwrite").objectStore("main"))
	);
}

function getAll(db) {
	return new Promise(async resolve => {
		const req = db.getAll();
		req.onsuccess = () => resolve(req.result);
	});
}

function deleteObj(db, name) {
	return new Promise(async resolve => {
		const req = db.delete(name);

		req.onsuccess = () => resolve(true);
	});
}

async function save(name, content) {
	const [db, event] = await openAsync("db-fs", false);

	await getAll(await getObject(db.result));

	await saveFile(event.target.result, name, content);

	return true;
}

async function get(searchFile) {
	const [db] = await openAsync("db-fs", false);

	const obj = await getObject(db.result);

	const all = await getAll(obj);

	try {
		return all.find(file => file.key == searchFile).body;
	} catch {
		return new Error({ message: "not found" });
	}
}

async function remove(searchFile) {
	var [db] = await openAsync("db-fs", false);

	var obj = await getObject(db.result);

	var all = await getAll(obj);

	await deleteObj(obj, all.find(file => file.key == searchFile).id);

	return true;
}

async function space(_detailed = true) {
	const data = await navigator.storage.estimate();

	return {
		max: data.quota,
		totalUse: data.usage,
		idb: data.usageDetails.indexedDB,
		percent: data.usage / data.quota,
	};
}

async function exists(searchFile) {
	const [db] = await openAsync("db-fs", false);

	const obj = await getObject(db.result);

	const all = await getAll(obj);

	// TODO: Refactor
	return all.find(file => file.key == searchFile) ? true : false;
}

async function readdir(dir) {
	const [db] = await openAsync("db-fs", false);

	const obj = await getObject(db.result);

	const all = await getAll(obj);

	return all.filter(file => file.dir == dir).map(file => file.key);
}

function getDir(db, name) {
	return new Promise(async resolve => {
		const obj = await getObject(db);
		const all = await getAll(obj);
		const data = {};

		all.forEach(({ key }) => {
			if (!key.startsWith(name)) return;
			if (key.split("/").length > 1) {
				const split = key.split("/")[0];
				data[split] = [];
			}
		});

		resolve(data);
	});
}

window.__XEN_WEBPACK.core.VFS = class {
	constructor() {}

	exists = exists;
	writeFile = save;
	readFile = async (file, json) =>
		json ? JSON.parse(await get(file)) : await get(file);
	readdir = readdir;
	getStorageData = space;
	removeFile = remove;
};
