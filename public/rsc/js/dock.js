const path = require("path-browserify");

window.__XEN_WEBPACK.core.DockComponent = class DockComponent {
	pins = [];
	itemOpen = null;

	constructor(fs) {
		this.fs = fs;
		this.split = document.querySelector(".os-dock-resize");
		this.cont = document.querySelector(".os-dock");

		this.startMenu = {};
	}

	async #remove(app) {
		const meta = await xen.apps.getMeta(app);

		document.getElementById("_Dock_" + meta.name).remove();

		var sep = document.getElementById("main-dock-resize");

		var after = [...document.querySelectorAll(".os-dock-item")].slice(
			[...document.querySelectorAll(".os-dock > *")].indexOf(sep)
		);

		if (!after.length) {
			sep.style.opacity = "0";
		}

		return true;
	}

	async #add(app, pin = false) {
		var that = this;

		const meta = await xen.apps.getMeta(app);

		// TODO: Have a fallback app icon
		const icon = path.join("/apps/" + app, meta.icon || "");

		var el = document.createElement("div");
		el.classList.add("os-dock-item");
		el.id = "_Dock_" + meta.name;
		el.dataset.app = app;
		el.dataset.name = meta.name;

		var tt = document.createElement("div");
		tt.classList.add("os-dock-tooltip");
		tt.setAttribute("style", "display:none;");

		var tti = document.createElement("div");
		tti.classList.add("os-dock-tooltip-inner");

		var ul = document.createElement("ul");
		var li = document.createElement("li");
		li.innerText = " No options ";
		ul.appendChild(li);

		tti.appendChild(ul);
		tt.appendChild(tti);

		var img = document.createElement("img");
		img.src = icon;
		img.onclick = new Function(`window.xen.apps.launch("${app}")`);

		// Fallback image
		img.onerror = () => (img.src = "https://google.com/favicon.ico");

		var indic = document.createElement("div");
		indic.classList.add("os-dock-item-indic");

		var nativeTT = [
			[
				"Quit",
				e => {
					if (
						document.getElementById(
							e.target.parentElement.parentElement.parentElement
								.parentElement.dataset.name
						)
					)
						document
							.getElementById(
								e.target.parentElement.parentElement
									.parentElement.parentElement.dataset.name
							)
							.querySelector(".os-exit")
							.click();
					else window.xen.dock.quit(app);
					that.itemOpen.style.display = "none";
				},
			],
		];

		if (nativeTT.length > 0) ul.innerHTML = "";

		nativeTT.forEach(e => {
			const li = document.createElement("li");

			li.onclick = e[1];
			li.innerText = e[0];

			ul.insertAdjacentElement("beforeend", li);
		});

		document.addEventListener("keyup", () => {
			event.preventDefault();

			if (that.itemOpen) that.itemOpen.style.display = "none";
		});

		el.addEventListener("contextmenu", e => {
			event.preventDefault();

			if (that.itemOpen) that.itemOpen.style.display = "none";

			let dockItem = el.getElementsByClassName("os-dock-tooltip")[0];
			console.log(dockItem);
			dockItem.style.display = "block";

			document.getElementById("dynamic-style").disabled = true;
			document.getElementById("dynamic-style2").disabled = false;

			that.itemOpen = dockItem;

			function cb(e) {
				try {
					if (!dockItem.contains(e.target)) {
						dockItem.style.display = "none";
						dockItem = null;
						document.getElementById(
							"dynamic-style"
						).disabled = false;
						document.getElementById(
							"dynamic-style2"
						).disabled = true;
						document.removeEventListener("mousedown", cb);
					}
				} finally {
				}
			}

			document.addEventListener("mousedown", cb);
		});

		el.appendChild(tt);
		el.appendChild(img);
		el.appendChild(indic);

		document.getElementById("main-dock-resize").style.opacity = "1";

		if (pin) this.cont.insertBefore(el, this.split);
		else this.cont.insertAfter(el, this.split);

		return true;
	}

	async opened(app) {
		const meta = await xen.apps.getMeta(app);

		if (this.pins.includes(app)) {
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector(".os-dock-item-indic").style.opacity = "1";
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector("img").onclick = () => {};
		} else {
			await this.#add(app);

			document
				.getElementById("_Dock_" + meta.name)
				.querySelector("img").onclick = () => {};
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector(".os-dock-item-indic").style.opacity = "1";
		}
	}

	async quit(app) {
		const meta = await xen.apps.getMeta(app);

		if (this.pins.includes(app)) {
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector(".os-dock-item-indic").style.opacity = "0";
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector("img").onclick = new Function(
				`window.xen.apps.launch("${app}")`
			);
		} else await this.#remove(app);
	}

	async pin(app) {
		const meta = await xen.apps.getMeta(app);

		let data = await this.fs.readFile("__DOCK_PINS.xen", true);

		if (data.indexOf(app) > -1) {
			data.splice(data.indexOf(app), 1);

			console.log(data);

			return await this.fs.writeFile(
				"__DOCK_PINS.xen",
				JSON.stringify(data)
			);
		}

		data.push(app);

		if (document.getElementById("_Dock_" + meta.name)) {
			console.log(document.getElementById("_Dock_" + meta.name));
		}

		await this.fs.writeFile("__DOCK_PINS.xen", JSON.stringify(data));

		return true;
	}

	async loadPins() {
		var that = this;

		var data = await this.fs.readFile("__DOCK_PINS.xen", true);

		for (const app of data) {
			that.pins.push(app);
			await that.#add(app, true);
		}

		return true;
	}

	async loadNative() {
		await this.menuStart();
		if (!(await this.fs.exists("__DOCK_PINS.xen")))
			await this.fs.writeFile(
				"__DOCK_PINS.xen",
				JSON.stringify([
					"Xen/Settings",
					"Xen/Store",
					"Xen/notes",
					"Xen/Testflight",
					"cohenerickson/Velocity",
				])
			);

		console.log("saved");

		await this.loadPins();

		return true;
	}

	async icon(app, url) {
		const meta = await xen.apps.getMeta(app);

		if (document.getElementById("_Dock_" + meta.name)) {
			document
				.getElementById("_Dock_" + meta.name)
				.querySelector("img").src = url;
		}
	}

	async show(app) {}

	async hide(app, open = false) {}

	// start menu time

	menu = false;

	async menuStart() {
		if (!(await xen.fs.exists("__START_PINS.xen")))
			await xen.fs.writeFile("__START_PINS.xen", "[]");

		var that = this;

		window.addEventListener("keyup", function (e) {
			console.log(e.key);
			if (e.key == "Alt") {
				if (!that.menu) {
					that.openMenu();
					that.menu = true;
				} else {
					that.closeMenu();
					that.menu = false;
				}
			}
		});

		document.getElementById("startButton").onclick = function () {
			if (!that.menu) {
				that.openMenu();
				that.menu = true;
			} else {
				that.closeMenu();
				that.menu = false;
			}
		};
	}

	async pinStart(app) {
		var meta = await xen.apps.getMeta(app);

		if (!(await xen.fs.exists("__START_PINS.xen")))
			await xen.fs.writeFile("__START_PINS.xen", "[]");

		if (
			(await xen.fs.readFile("__START_PINS.xen", true)).indexOf(app) > -1
		) {
			var data = await xen.fs.readFile("__START_PINS.xen", true);

			data.splice(data.indexOf(app, 1));

			return await xen.fs.writeFile(
				"__START_PINS.xen",
				JSON.stringify(data)
			);
		}

		await xen.fs.writeFile(
			"__START_PINS.xen",
			JSON.stringify([
				...(await xen.fs.readFile("__START_PINS.xen", true)),
				app,
			])
		);
	}

	createMenu(apps) {
		var that = this;

		var master = document.createElement("div");
		master.classList.add("start-menu");
		master.style.height = "0px";

		master.innerHTML = `
      <div class="start-over" style="height:0px">
        <div class="start-left">${
			apps
				.map(
					e =>
						`<div class="start-app" data-app="${
							e.id
						}"><img class="start-app-icon" src="${path.join(
							`/apps/${e.id}/`,
							e.icon
						)}">${e.name}</div>`
				)
				.join("\n") || "No Apps"
		}</div>
        <div class="start-right">Something</div>
      </div>
    `;

		master.querySelectorAll(".start-app").forEach(el => {
			el.onclick = () => {
				that.closeMenu();
				that.menu = false;

				window.xen.apps.launch(el.dataset.app);
			};
		});

		return master;
	}

	menuTimeout = 0;

	async openMenu() {
		var that = this;
		if (this.menu) return;
		await xen.wait(this.menuTimeout);

		if (document.querySelector(".start-menu"))
			document.querySelector(".start-menu").remove();
		if (this.menuTime) clearTimeout(this.menuTime);
		const apps = await xen.fs.readFile("__START_PINS.xen", true);

		for (var app in apps) {
			var meta = await xen.apps.getMeta(apps[app]);
			meta.id = apps[app];

			apps[app] = meta;
		}

		var el = this.createMenu(apps);

		document
			.querySelector(".os-taskbar-cont")
			.insertAdjacentElement("afterbegin", el);

		setTimeout(function () {
			document.querySelector(".os-taskbar-cont").style.height = "560px";
			document.querySelector(".start-over").style.height = "500px";
			document.querySelector(".start-menu").style.height = "500px";
		}, 5);

		setTimeout(function () {
			document.querySelector(".start-left").style.opacity = "1";
			document.querySelector(".start-right").style.opacity = "1";
		}, 30);

		this.menuTimeout = 50;

		function cb(event) {
			try {
				if (!el.contains(event.target)) {
					if (
						document
							.getElementById("startButton")
							.contains(event.target)
					)
						return;

					that.closeMenu();
					that.menu = false;

					document.removeEventListener("mousedown", cb);
				}
			} finally {
			}
		}

		document.addEventListener("mousedown", cb);
	}

	async closeMenu() {
		if (!this.menu) return;
		await xen.wait(this.menuTimeout);

		document.querySelector(".start-over").style.height = "0px";
		document.querySelector(".start-menu").style.height = "0px";
		document.querySelector(".os-taskbar-cont").style.height = "60px";

		this.menuTime = setTimeout(function () {
			document.querySelector(".start-menu").remove();
		}, 150);

		this.menuTimeout = 200;
	}
};
