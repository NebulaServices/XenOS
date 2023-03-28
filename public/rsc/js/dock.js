const path = require("path-browserify");

window.__XEN_WEBPACK.core.DockComponent = class DockComponent {
	pins = [];
	itemOpen = null;

  dockOpen = [];

	constructor(fs) {
		this.fs = fs;
		this.split = document.querySelector(".os-dock-resize");
		this.cont = document.querySelector(".os-dock");

    this.startMenu = {};
    this.size = 1;
	}

	async #remove(app) {
    if (!this.dockOpen.includes(app)) return;
		const meta = await xen.apps.getMeta(app);

		document.getElementById("_Dock_" + meta.name).remove();

    var sep = document.getElementById('main-dock-resize');

    var after = [...document.querySelectorAll('.os-dock-item')].slice([...document.querySelectorAll('.os-dock > *')].indexOf(sep));

    if (!after.length) {
      sep.style.opacity = '0';
    }

		return true;
	}

	async #add(app, pin = false) {
		var that = this;

		const meta = await xen.apps.getMeta(app);

    that.dockOpen.push(app);

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
          if (document.getElementById(e.target.parentElement.parentElement.parentElement.parentElement.dataset.name)) document.getElementById(e.target.parentElement.parentElement.parentElement.parentElement.dataset.name).querySelector('.os-exit').click(); else window.xen.dock.quit(app); that.itemOpen.style.display = "none";
        }
      ],
      [
        "Pin to Dock",
        e => {
          console.log(this);
        }
      ]
    ];

		if (nativeTT.length > 0) ul.innerHTML = "";

		nativeTT.forEach(e => {
      var li = document.createElement('li');

      li.onclick = e[1];

      li.innerText = e[0]
      
			ul.insertAdjacentElement(
				"beforeend",
				li
			);
		});

    document.addEventListener('keyup', () => {
			event.preventDefault();

			if (that.itemOpen) that.itemOpen.style.display = "none";
    });

		el.addEventListener("contextmenu", event => {
			event.preventDefault();

			if (that.itemOpen) that.itemOpen.style.display = "none";

			var dockItem = el.getElementsByClassName("os-dock-tooltip")[0];
      console.log(dockItem);
			dockItem.style.display = "block";

			document.getElementById("dynamic-style").disabled = true;
			document.getElementById("dynamic-style2").disabled = false;

			that.itemOpen = dockItem;

      function cb(event) {
				try {
					if (!dockItem.contains(event.target)) {
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
				} catch (err) {
					
				}
			}

			document.addEventListener("mousedown", cb);
		});

		el.appendChild(tt);
		el.appendChild(img);
		el.appendChild(indic);

    document.getElementById('main-dock-resize').style.opacity = '1';

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
				.querySelector("img")
				.onclick = function() {};
		} else {
			await this.#add(app);

			document
				.getElementById("_Dock_" + meta.name)
				.querySelector("img")
				.onclick = function() {
          xen.apps.unminimize(meta.name);
        };
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
				.querySelector("img")
				.onclick = new Function(`window.xen.apps.launch("${app}")`);
		} else await this.#remove(app);
	}

	async pin(app) {
    let data = await this.fs.readFile("__DOCK_PINS.xen", true);

    if (data.indexOf(app)>-1) {
      data.splice(data.indexOf(app), 1);

      console.log(data);
      
      return await this.fs.writeFile("__DOCK_PINS.xen", JSON.stringify(data));
    }
    
		const meta = await xen.apps.getMeta(app);

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
					"cohenerickson/Velocity"
				])
			);

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
    if (!await xen.fs.exists('__START_PINS.xen')) await xen.fs.writeFile('__START_PINS.xen', '[]');
    
    var that = this;
    
    window.addEventListener('keyup', function(e) {   
      if (e.key=='Alt') {
        if (!that.menu) {
          that.openMenu();
          return that.menu = true;
        } else {
          that.closeMenu();
          return that.menu = false;
        }
      }

      if (that.menu) that.searchHandler(e);
    });

    window.addEventListener('keydown', function(e) {   
      if (that.search) document.querySelector('.start-input').focus();

      if (that.menu&&e.key!=='Alt') that.searchHandler(e);
    });
    
    document.getElementById('startButton').onclick = function(){
      if (!that.menu) {
        that.openMenu();
        that.menu = true;
      } else {
        that.closeMenu();
        that.menu = false;
      }
    }

    return true;
  }

  async pinStart(app) {
    var meta = await xen.apps.getMeta(app);

    if (!await xen.fs.exists('__START_PINS.xen')) await xen.fs.writeFile('__START_PINS.xen', '[]');

    if ((await xen.fs.readFile('__START_PINS.xen', true)).indexOf(app)>-1) {
      var data = await xen.fs.readFile('__START_PINS.xen', true);

      data.splice(data.indexOf(app, 1));

      return await xen.fs.writeFile('__START_PINS.xen', JSON.stringify(data));
    }

    await xen.fs.writeFile('__START_PINS.xen', JSON.stringify([...await xen.fs.readFile('__START_PINS.xen', true), app]));
  }

  createMenu(apps) {
    var that = this;
    
    var master = document.createElement('div');
    master.classList.add('start-menu');
    master.style.height = '0px';

    master.innerHTML = `
      <div class="start-over" style="height:0px">
        <div class="start-left">${apps.map(e=>`<div class="start-app" data-app="${e.id}"><img class="start-app-icon" src="${path.join(`/apps/${e.id}/`, e.icon)}">${e.name}</div>`).join('\n')||'No Apps'}</div>
        <div class="start-right">press any key to search</div>
      </div>

      <div class="start-search" style="height:0px">
        <button class="start-back"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/></svg></button>
        <input class="start-input">
        <div class="start-results"></div>
      </div>
    `

    master.querySelectorAll('.start-app').forEach(el => {
      el.onclick = function() {
        that.closeMenu();
        that.menu = false;
        
        window.xen.apps.launch(el.dataset.app);
      }
    });

    return master;
  }

  menuTimeout = 0;

  async openMenu() {
    var that = this;
    if (this.menu) return;
    await xen.wait(this.menuTimeout);
    
    if (document.querySelector('.start-menu')) document.querySelector('.start-menu').remove();
    if (this.menuTime) clearTimeout(this.menuTime);
    const apps = await xen.fs.readFile('__START_PINS.xen', true);

    for (var app in apps) {
      var meta = await xen.apps.getMeta(apps[app]);
      meta.id = apps[app];

      apps[app] = meta;
    }

    var el = this.createMenu(apps);

    document.querySelector('.os-taskbar-cont').insertAdjacentElement('afterbegin', el);

    setTimeout(function() {
      document.querySelector('.os-taskbar-cont').style.height = '560px';
      document.querySelector('.start-over').style.height = '500px';
      
      document.querySelector('.start-menu').style.height = '500px';
    }, 5);

    setTimeout(function() {
      document.querySelector('.start-left').style.opacity = '1';
      document.querySelector('.start-right').style.opacity = '1';
    }, 30);

    this.menuTimeout = 50;

    function cb(event) {
      try {
        if (!el.contains(event.target) && !document.querySelector('.start-menu').contains(event.target)) {
          if (document.getElementById('startButton').contains(event.target)) return;
          
          that.closeMenu();
          that.menu = false;
          document.removeEventListener("mousedown", cb);
        }
      } catch (err) {
        
      }
    }

    document.addEventListener("mousedown", cb);
  }

  async closeMenu() {
    if (!this.menu) return;
    await xen.wait(this.menuTimeout);
    
    document.querySelector('.start-over').style.height = '0px';
    document.querySelector('.start-menu').style.height = '0px';
    document.querySelector('.os-taskbar-cont').style.height = '60px';
    
    this.menuTime = setTimeout(function() {
      document.querySelector('.start-menu').remove();
    }, 150);

    this.menuTimeout = 100;

    this.search = false;
  }

  search = false;

  searchHandler(e) {
    var that = this;
    
    if (!that.search) return that.initSearch(e);

    if (e.type=='keyup') if (e.key=='Enter') {
      if (that.selectedItem) {
        
      } else {
        xen.apps.launch(document.querySelector('.start-results .start-app').dataset.app);

        that.closeMenu();that.menu = false;
      }
    }
  }

  async handleSearch(e) {
    var that = this;

    document.querySelector('.start-results').innerHTML = await this.generateSearch(e);

    document.querySelectorAll('.start-results .start-app').forEach(el => {
      el.onclick = (e) => {xen.apps.launch(el.dataset.app);that.closeMenu();that.menu = false;};
    });
  }

  initSearch(e) {
    var that = this;
    
    document.querySelector('.start-over').style.opacity = '0';

    document.querySelector('.start-back').onclick = function(e) {
      that.search = false;
      document.querySelector('.start-search').style.opacity = '0';
     
      setTimeout(function() {
        document.querySelector('.start-over').style.opacity = '1';

        document.querySelector('.start-results').innerHTML = '';
        document.querySelector('.start-input').value = '';
      }, 80);
    }

    document.querySelector('.start-input').oninput = function(e) {
      var a = e.target.value+'';
      setTimeout(function() {
        if (a==e.target.value) that.handleSearch(e.target.value.trim());
      }, 50);
    };

    setTimeout(function() {
      document.querySelector('.start-input').dispatchEvent(new KeyboardEvent('keydown', {key: e.key}));
      document.querySelector('.start-search').style.opacity = '1';
          document.querySelector('.start-search').style.height = '475px'
      
    }, 80);

    document.querySelector('.start-input').focus();

    this.search = true;

    this.handleSearch('')
  }

  async generateSearch(term) {
    var data = {
      apps: [],
      search: [],
      news: [],
    }
    
    const apps = await Promise.all((await (await fetch('/apps/data')).json()).map(async e=>await (await fetch('/apps/'+e+'/manifest.json')).json()));
    var names = apps.map(e=>e.name);

    if (names.find(e=>e.toLowerCase().includes(term.toLowerCase()))) {
      data.apps = names.filter(e=>e.toLowerCase().includes(term.toLowerCase()));
    }

    var html = `<div class="search-apps">${data.apps.map(e=>apps.find(g=>g.name==e)).map(e=>`<div class="start-app" data-app="${e.id}"><img class="start-app-icon" src="${path.join(`/apps/${e.id}/`, e.icon)}">${e.name}</div>`).join('\n')}</div>`;

    return html;
  }

  resize(way){
    const mainNode = document.getElementById('os-taskbar-resizable')
    if (way == 'up'){
      mainNode.style = 'transform: scale(1.2);bottom: 8px;'
    } else if (way == 'down'){
       mainNode.style = 'transform: scale(.5); bottom: -11px;'
    }
    
  }
};