const core = window.__XEN_WEBPACK.core;

core.AppManagerComponent = class AMC {
  fileApps = [];
  intervalFuncs = [];
	minimized = [];
  dragData = {};
  minDown = {};
  
  apps = {
    appsInstalled: [],
  };
  
	constructor() {}
  
  clearIntervals() {
    this.intervalFuncs = this.intervalFuncs.filter(func=>clearInterval(func));
  }
  
  loaderBegin(LoadText) {
  	let bar = "▇";
  	let barCount = 10;
  
  	this.intervalFuncs.push(() => {
  		let loadingBar = "";
  
  		for (const i in barCount) loadingBar += bar;
  
  		console.log(loadingBar + "   " + LoadText);
  
  		barCount = (barCount + 1) % 11;
  	});
  }

  async start() {
    var data = [];
    
    var json = await (await fetch('/apps/data')).json();

    for (var k of json) {
      try {
        var req = await (await fetch('/apps/'+k+'/manifest.json')).json();
  
        var g = {};
  
        g[req.name] = req;
  
        data.push(g);
      } catch(e) {
        console.log(e);
      }
    };

    this.apps = {
      appsInstalled: new Object(data)
    }

    return true;
  }

	#install(author, proj, file, content, entry, log) {
    return new Promise(resolve => {
  		navigator.serviceWorker.onmessage = async () => {
  			if (log) console.log("STATUS: INSTALLED (3)");
  		};

      function callback(e) {
        if (e.data!==`/apps/${author}/${proj}/${file}`) return false;
        console.log('STATUS: OK (4)');

        navigator.serviceWorker.removeEventListener('message', callback);
        resolve();
      };

      navigator.serviceWorker.addEventListener('message', callback);
  
  		navigator.serviceWorker.ready.then(registration =>
  			registration.active.postMessage({
  				info: {
  					author: author,
  					project: proj,
  					entry: entry,
  				},
  				file: file,
  				log: log || false,
  				content: content,
  			})
  		);
    });
	}

	install(
		pkg,
		repo = "https://xenos-app-repository.enderkingj.repl.co",
		log = true
	) {
		if (log) console.log(`Installing ${pkg}`);

    var that = this;

		return new Promise(async resolve => {
			const [author, project] = pkg.split("/");

			var percent = 0;

			// prefetch app details
			percent += 1;
			that.clearIntervals();
			if (log) loaderBegin("FETCHING META: ", "1");

			var metaBody = {
				id: pkg,
			};

			try {
				var meta = await (
					await fetch(repo + "/stream", {
						method: "POST",
						body: JSON.stringify(metaBody),
					})
				).json();
			} catch (e) {
				percent += 19;

				if (log) this.loaderBegin(`FAILURE: ${meta.name}`, "2");

				return;
			}
			percent += 19;
			that.clearIntervals();
			if (log) this.loaderBegin(`SUCCESS: ${meta.name}`, "2");

			metaBody.session = meta.session;

			var togo = 100 - percent - 20;
			var percent = togo / meta.assets.length;

      var promises = [];

			for (let asset of meta.assets) {
        promises.push(new Promise(async resolve => {
  				metaBody.asset = asset;
  
  				that.clearIntervals();
  				if (log) that.loaderBegin(`FETCH: ${meta.name}/${asset}`, "3");
  
  				percent += Math.floor(percent);
  
  				var resp = await fetch(repo + "/download", {
  					method: "POST",
  					body: JSON.stringify(metaBody),
  				});
  
  				var body = await resp.blob();
  				that.clearIntervals();
  				if (log) that.loaderBegin(`SUCCESS: ${meta.name}/${asset}`, "4");
  
  				await that.#install(
  					author,
  					project,
  					asset,
  					body,
  					meta.entry,
  					log
  				);

          resolve();
        }));
			}

			that.clearIntervals();
			if (log) that.loaderBegin(`FETCH: SESSION_CLEAR (END_SESS)`, "5");

			await fetch(repo + "/clear", {
				method: "POST",
				body: JSON.stringify(metaBody),
			});

			percent += 20;

			if (log) that.loaderBegin(`SUCCESS: SESSION_CLEAR (SUSSEND)`, "6");
			if (log) that.loaderBegin(`SUCCESS: ${meta.name} DOWNLOADED`, "7");

			return resolve(true);
		});
	}

	async update(
		pkg,
		repo,
		log = true
	) {
		repo = repo || "https://xenos-app-repository.enderkingj.repl.co";

		try {
			var ver = (await this.getMeta(pkg)).version;

			var currVer = await (
				await fetch(repo + "/version", {
					method: "POST",
					body: JSON.stringify({
						pkg,
					}),
				})
			).text();

			if (ver == currVer) return true;
		} catch(e) {console.log(e)}
console.log(pkg + ' updating')
		return await this.install(pkg, repo, log);
	}

  async #errorWin(error, meta, app) {
    xen.system.register(meta.name, '0px', '0px', URL.createObjectURL(new Blob([`<!DOCTYPE html><html><head><style>@import url(/rsc/font/Montserrat.css);@import url(/rsc/font/Inter.css);@import url(/rsc/font/IBMPlexSans.css);body {color: white;font-family: "IBM Plex Sans";}</style><script>const error = atob("${btoa(error)}");</script></head><body>${meta.name} Encountered an Unexpected Error<br><button id="ok">Ok</button><button id="copy">Copy to Clipboard</button><button id="troubleshoot">Troubleshoot</button><script>document.getElementById('ok').onclick = function(e) {window.parent.xen.dock.quit("${app}");window.parent.xen.system.unregister("${meta.name}");window.parent.document.dispatchEvent(new CustomEvent("WindowClose", {window: "${meta.name}",detail: { text: "${meta.name}" }}));return;}document.getElementById('copy').onclick = function(e) {return;}</script></body></html>`], {type: 'text/html'})), true, '350px', '100px');
  }

	async launch(app) {
		const path = "/apps/" + app;
		const meta = await this.getMeta(app);
    
		await xen.dock.opened(app);

		if (meta.type === "app") {
      try {
        var req = await fetch(path + "/" + meta.entry);
      
        var mainFile = await (req).text();
  
  			window.xen.apps.loader.load(meta.name, mainFile, path, app);
      } catch(err) {
        this.#errorWin(err, meta, app);
      }
		}

		if (meta.type === "embed") {
			const location = localStorage.get("prefix") + meta.embedUrl;

			// TODO: Convert xen.system.register to use promise and return the iframe element so that an inject script can be added to it
			if (xen.windowManager.windows[meta.name]._min == "true") {
				xen.apps.minClick({}, meta.name);
			}
			xen.system.register(meta.name, "10", "10", location);
		}

		if (meta.type == "file") {
			var file = "/apps/" + app + "/" + meta.file;

      this.fileApps.push([app, meta]);

			xen.system.register(meta.name, "10", "10", file);
		}
	}

  async uninstall(pkg) {
    var meta = await (await fetch("/apps/" + pkg + "/manifest.json")).json();

    var promises = [];

    meta.assets.forEach(asset => {
      promises.push(new Promise(async resolve => {
        var c = await caches.open('apps');

        await c.delete('/apps/'+meta.id+'/'+asset);

        resolve();
      }));
    });

    await xen.awaitAll(...promises);
    await xen.apps.start();

    return true;
  }

	async getMeta(pkg) {
    try {
  		return await (await fetch("/apps/" + pkg + "/manifest.json")).json();
    } catch(e) {
      await this.install(pkg);

      return await (await fetch("/apps/" + pkg + "/manifest.json")).json();
    }
	}

  createDrag(name) {
    var that = this;
    this.dragData[name] = {startX: this.minDown[name].clientX-this.minDown[name].target.offsetLeft, startY: this.minDown[name].clientY-this.minDown[name].target.offsetTop, };

    this.minDown[name].target.querySelectorAll('*').forEach(el=>el.style.pointerEvents='none');
    
    function move(e) {
      let left = e.clientX - that.dragData[name].startX;
			let top = e.clientY - that.dragData[name].startY;

      if (top<-193) top = -193;

			requestAnimationFrame(() => {
				that.minDown[name].target.style.position = `absolute`;
				that.minDown[name].target.style.top = `${top}px`;
				that.minDown[name].target.style.left = `${left}px`;
			});
    }

    function up() {
      document.removeEventListener('mouseup', up);
      document.removeEventListener('mousemove', move);
    }

    document.addEventListener('mouseup', up);
    
    document.addEventListener('mousemove', move);

    return move;
  }

  minMDown(event, name) {
    if (event.which!==1) return;
    
    this.minDown[name] = event;

    this.createDrag(name);
  }

	minClick(event, name) {
    if (event.clientX==this.minDown[name].clientX && event.clientY==this.minDown[name].clientY) {		
      this.unminimize(name);
		  return xen.windowManager.modWin(name, "_min", "false");
    }
	}

  ctxMenu(event) {
    event.preventDefault();

    var el = event.target;

    event.target.style.transition = 'all 0.2s ease';
    event.target.style.transform = 'scale(0)';

		setTimeout(function () {
			el.style.transition = "all 0.001s ease-in-out 0s";
		}, 200);
  }

	minimize(name) {
		var that = this;

		var el = document.getElementById(name);

		if (that.minimized.includes(el)) return this.unminimize(name);

    el.addEventListener('contextmenu', that.ctxMenu);

    el.querySelectorAll('*').forEach(el=>el.style.pointerEvents='none');
    
    el.style.transition = 'all 0.5s ease';
    el.style.transform = 'scale(0.1)';
    
		el.querySelectorAll("iframe").forEach(
			e => (e.style.pointerEvents = "none")
		);

		that.minimized.push(el);
		xen.windowManager.modWin(name, "_min", "true");

		setTimeout(function () {
			el.style.transition = "all 0.001s ease-in-out 0s";
			xen.windowManager.modWin(name, "minimized", true);
      el.onmousedown = new Function('e', `{xen.apps.minMDown(e, "${name}")}`);
			el.onmouseup = new Function('e', `{xen.apps.minClick(e, "${name}")}`);
		}, 500);
	}

	unminimize(name) {
		var that = this;

		const el = document.getElementById(name);

    if (parseInt(el.style.top.replace('px', ''))<32) el.style.top = '32px';

    el.removeEventListener('contextmenu', that.ctxMenu);

		el.style.transition = "all 0.5s ease";
		el.style.transform = "scale(1)";

    el.querySelectorAll('*').forEach(
      e => (e.style.pointerEvents = '')
    );

		el.querySelectorAll("iframe").forEach(
			e => (e.style.pointerEvents = "none")
		);

		// TODO: Convert this to css
		setTimeout(function () {
			el.style.transition = "all 0.001s ease-in-out 0s";
			that.minimized.splice(that.minimized.indexOf(el), 1);
			xen.windowManager.modWin(name, "minimized", false);
      
			el.onmousedown = new Function();
      el.onmouseup = new Function();
		}, 500);
	}
};