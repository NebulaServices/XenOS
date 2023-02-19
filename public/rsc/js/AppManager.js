function warning(a) {
	console.warning(
		"%c " + a,
		"color:white;font-weight:bold;background-color:#de5b00;font-size:20px;"
	);
}
function bad(a) {
	console.error(
		"%c " + a,
		"color:white;font-weight:bold;background-color:red;font-size:20px;"
	);
}
function good(a) {
	console.error(
		"%c " + a,
		"color:white;font-weight:bold;background-color:green;font-size:20px;"
	);
}
let intervalIds = [];
let dj = false; 
function loaderBegin(LoadText){
dj = true;
var bar = "▇";
var barCount = 10;

const id = setInterval(function() {
  
      var loadingBar = "";
   // console.clear();
  for (var i = 0; i < barCount; i++) {
    loadingBar += bar;
  }
  console.log(loadingBar + "   " + LoadText);
  barCount = (barCount + 1) % 11;

}, 200);
intervalIds.push(id)
}
function clearIntervals() {
  intervalIds.forEach(function(id) {
    clearInterval(id);
  });
  intervalIds = [];
}
function stopLoader(id){
  clearInterval(id);
}
window.__XEN_WEBPACK.core.AppManagerComponent = class AMC {
	constructor() {
		this.apps = {
			appsInstalled: [{ WelcomeToXenOS: { repository: "none/preload" } }],
		};
	}

	async #install(author, proj, file, content, entry, log) {
		navigator.serviceWorker.addEventListener("message", async event => {
			//console.log(event.data);
			if (log) console.log("Installed!");
		});

		navigator.serviceWorker.ready.then(registration =>
			registration.active.postMessage({
				info: {
					author: author,
					project: proj,
          entry: entry,
				},
				file: file,
        log: log||false,
				content: content,
      })
		);
	}

	install(
		pkg,
		repo = "https://xenos-app-repository.enderkingj.repl.co",
    log = true
	) {
    console.log('_debug_install: '+pkg)
      
    return new Promise(async (resolve) => {
      if (!repo) repo = "https://xenos-app-repository.enderkingj.repl.co";
      
  		const [author, project] = pkg.split("/");
  
  		var percent = 0;
  
  		// prefetch app details
  		percent += 1;
      clearIntervals()
      if (log) loaderBegin('FETCHING META: ', '1')
  
  
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

      } catch(e) {
        percent += 19;

        if (log) loaderBegin(`FAILURE: ${meta.name}`, '2');

        return;
      }
  		percent += 19;
  	 clearIntervals()
      if (log) loaderBegin(`SUCCESS: ${meta.name}`, '2')
  
  
  		metaBody.session = meta.session;
  
  		var togo = 100 - percent - 20;
  		var per = togo / meta.assets.length;
  
  		for (let asset of meta.assets) {
  			metaBody.asset = asset;
  
       clearIntervals()
       if (log) loaderBegin(`FETCH: ${meta.name}/${asset}`, '3')
  			
  
  			percent += Math.floor(per);
  
  			var resp = await fetch(repo + "/download", {
  				method: "POST",
  				body: JSON.stringify(metaBody),
  			});
  
  			var body = await resp.blob();
  clearIntervals()
      if (log) loaderBegin(`SUCCESS: ${meta.name}/${asset}`, '4')
  		
  			await this.#install(author, project, asset, body, meta.entry, log);
  		}
  
     clearIntervals()
      if (log) loaderBegin(`FETCH: SESSION_CLEAR (END_SESS)`, '5')
  		
  
  		var resp = await fetch(repo + "/clear", {
  			method: "POST",
  			body: JSON.stringify(metaBody),
  		});
  
  		percent += 20;
  
      clearIntervals()
      if (log) loaderBegin(`SUCCESS: SESSION_CLEAR (SUSSEND)`, '6')
  		
  
          clearIntervals()
      if (log) loaderBegin(`SUCCESS: ${meta.name} DOWNLOADED`, '7')
      clearIntervals()

      return resolve(true);
    });
	}

  async update(
		pkg,
		repo = "https://xenos-app-repository.enderkingj.repl.co",
    log = true
	) {
    if (!repo) repo = "https://xenos-app-repository.enderkingj.repl.co";

    try {
      var version = (await (await fetch('/apps/'+pkg+'/manifest.json')).json()).version
  
      var _version = await (await fetch(repo+"/version", {
        method: 'POST',
        body: JSON.stringify({
          pkg,
        })
      })).text();
  
      if (version==_version) return true;
    } catch {}

    return await this.install(pkg, repo, log);
  }

	async launch(pkg, callbackFunc, openType) {
    
		const path = "/apps/" + pkg;
		const meta = await (await fetch(path + "/manifest.json")).json();

    await xen.dock.opened(pkg);

    // document.querySelector(`#_Dock_${meta.name} .os-dock-item-indic`).style.opacity = '1';

		if (meta.type === "app") {
			
      var mainFile = await (await fetch(path + "/" + meta.entry)).text();

			window.xen.apps.loader.load(meta.name, mainFile, path, pkg);
      		
			
			//const location = path + "/index.html";

			//xen.system.register(meta.name, "10", "10", location);
		}

		if (meta.type === "embed") {
			const location = localStorage.get("prefix") + meta.embedUrl;

			// TODO: Convert xen.system.register to use promise and return the iframe element so that an inject script can be added to it
       alert('buh')
    if (xen.windowManager.windows[meta.name]._min == "true"){
      xen.apps.minClick({}, "${name}")
     
    }
			xen.system.register(meta.name, "10", "10", location);
		}

    if (meta.type=='file') {
      var file = '/apps/'+pkg+'/'+meta.file;

      xen.system.register(meta.name, "10", "10", file);
    }
	
	}

  minimized = []

  minClick(event, name) {
    console.log('sus')
    this.unminimize(name);
        xen.windowManager.modifyWindow(name, "_min", "false")

  }

  dockMinimize(el) {
    var last = [...document.querySelectorAll('.os-dock-item')].pop();

    var rects = last.getBoundingClientRect();

    console.log(rects)

    var x = rects.left+11 - (0.2 * el.clientWidth) - 50;
    var y = rects.top - rects.height - 62 - (0.05 * el.clientHeight);

    el.style.left = x+'px';
    el.style.top = y+'px';
  }

  minimize(name) {    
    var that = this;
    
    var el = document.getElementById(name);

    if (that.minimized.includes(el)) return this.unminimize(name); 

    el._left = el.getBoundingClientRect().x+'px';
    el._top = el.getBoundingClientRect().y+'px';
    el._z = window.getComputedStyle(el).zIndex;

    el.style.left = el._left;
    el.style.top = el._top;

    el.style.transition = 'all 0.5s ease';
    el.style.transform = 'scale(0.1)';
    el.style.zIndex = 9999999999;
    

    that.dockMinimize(el);
    el.querySelectorAll('iframe').forEach(e=>e.style.pointerEvents='none');

    that.minimized.push(el);
    xen.windowManager.modifyWindow(name, "_min", "true")

    console.log(name);

    setTimeout(function() {
      el.style.zIndex = 9999999999;
    }, 10);

    setTimeout(function() {
      el.style.transition = 'all 0.001s ease-in-out 0s';
      xen.windowManager.modifyWindow(name, 'minimized', true);
      el.setAttribute('onclick', `{xen.apps.minClick({}, "${name}")}`);
    }, 500);
  }

  unminimize(name) {
    var that = this;
    
    var el = document.getElementById(name);

    el.style.transition = 'all 0.5s ease';

    el.style.left = el._left;
    el.style.zIndex = el._z;
    el.style.top = el._top;
    el.style.transform = 'scale(1)';
    el.querySelectorAll('iframe').forEach(e=>e.style.pointerEvents='none');

    setTimeout(function() {
      el.style.transition = 'all 0.001s ease-in-out 0s';
      that.minimized.splice(that.minimized.indexOf(el), 1);
      xen.windowManager.modifyWindow(name, 'minimized', false);
      el.setAttribute('onclick', '');
    }, 500);
  }
};
