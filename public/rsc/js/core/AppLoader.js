const path = require('path-browserify');

window.__XEN_WEBPACK.winRaw = [];

var appWin = class WIN {
	listeners = [];

	constructor(options = {}, name, path, _xen) {
		window.__XEN_WEBPACK.winRaw.push(this);
		this.opts = Object.assign(
			{
				frame: true,
				transparent: false,
				fullScreen: false,
				width: 800,
				height: 500,
				alwaysOnTop: false,
				show: true,
				x: 10,
				y: 10,
				allCloseQuit: true,
        focus: true,
			},
			options
		);

		this.name = name;
		this.path = path;
		this.xen = _xen;

		var el = xen.system.register(
			name,
			this.opts.x + "px",
			this.opts.y + "px",
			undefined,
			false,
      this.opts.width+'px',
      this.opts.height+'px'
		);

    if (this.opts.focus) window.xen.windowManager.focus(name);

		this.el = el;

		this.registerMessages(el.querySelector("iframe").contentWindow);
	}
	registerMessages(win) {
		var that = this;

		window.addEventListener("message", (data, _origin) => {
			if (data.source == win)
				that.emit(data.data.message, ...data.data.data);
		});
	}
	winClosed(event) {
		if (this.opts.allCloseQuit && (event.detail.text == this.name)) this.xen.quit(this._name);
	}
	on(event, callback) {
		this.listeners.push([event, callback]);
	}
	emit(event, ...data) {
		this.listeners.filter(e => e[0] == event).forEach(e => e[1](...data));
	}
	once(event, callback) {
		callback = new Proxy(callback, {});

		this.listeners.push([event, callback]);
	}

	loadURL(url) {
		document.getElementById(this.name).querySelector("iframe").src = url;
	}
	loadFile(url) {
		var _path = path.join(this.path, url);
    
		fetch(_path)
			.then(e => e.text())
			.then(e => {
				document.getElementById(this.name).querySelector("iframe").src =
					_path;
			});
	}
	requestFileSystem() {
		//const flag = this.name + "_permission_filesystem";
	}
	executeJavascript(code = "") {
		this.el.querySelector("iframe").contentWindow.postMessage({
			message: "__XEN_LISTENER_CONNECTION_MANAGER",
			data: { type: "executeJS", code },
		});
	}
	requestDispatchNotification(notificationName, body) {
		const flag = this.name + "_permission_notify";
		console.log(flag);
		var permCheck = localStorage.getItem(flag);
		console.log(permCheck);
		if (permCheck == null || permCheck == undefined || permCheck == false) {
			xen.browserTool.fullscreen();
			const requestMessage = confirm(
				this.name +
					" Wants permission to send in-OS notifications. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"
			);
			if (requestMessage == true) {
				console.log("Permission granted");
				localStorage.setItem(flag, "true");
				setTimeout(function () {
					xen.notification.dispatch(notificationName, body);
				}, 600);
			} else {
				console.log("permission refused");
			}
			xen.browserTool.fullscreen();
		} else if (permCheck === "true") {
			xen.notification.dispatch(notificationName, body);
		}
	}
  requestBareServer(){
    const flag = this.name + "_permission_notify";
		console.log(flag);
		var permCheck = localStorage.getItem(flag);
		console.log(permCheck);
		if (permCheck == null || permCheck == undefined || permCheck == false) {
      	const requestMessage = confirm(
				this.name +
					" Wants permission to send in-OS notifications. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"
			);
      if (requestMessage == true) {
				console.log("Permission granted");
				localStorage.setItem(flag, "true");
      } else {
         console.log('permission denied')
        
      } 
    }else if (permCheck === 'true'){
      
      }
    } 


  requestModifySetting(settingFlag, setting){
      const flag = this.name + "_permission_settingF";
		console.log(flag);
		var permCheck = localStorage.getItem(flag);
		console.log(permCheck);
		if (permCheck == null || permCheck == undefined || permCheck == false) {
      	const requestMessage = confirm(
				this.name +
					" Wants permission to modify settings. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"
			);
      if (requestMessage == true) {
				console.log("Permission granted");

 if (settingFlag === 'backdrop') {
    xen.settings.setBg(xen.settings.background[setting])
 }

        if (settingFlag=='customBackdrop') {
          xen.settings.setCustomBg(setting);
        }
        
				localStorage.setItem(flag, "true");
      } else {
         console.log('permission denied')
        
      } 
    }else if (permCheck === 'true'){
      if (settingFlag === 'backdrop') {
        xen.settings.setBg(xen.settings.background[setting])
   }
        if (settingFlag=='customBackdrop') {
          xen.settings.setCustomBg(setting);
        }
      }
  }
  } // its me


var _NativeWindow = class NATWIN {
	constructor(window) {
		this.raw = window;
	}

	getBounds() {
		return {
			x: this.raw.locX,
			y: this.raw.locY,
			width: this.raw.el.offsetWidth,
			height: this.raw.el.offsetHeight,
		};
	}
};

appWin.getAllWindows = function () {
	return Object.entries(xen.windowManager.windows).map(([name, window]) => {
		return window.native ? new _NativeWindow(window) : window;
	});
};

window.__XEN_WEBPACK.core.AppLoaderComponent = class ALC {
	window = appWin;

	constructor() {
		document.addEventListener("WindowClose", function (close) {
			window.__XEN_WEBPACK.winRaw.forEach(win => {
				if (win.winClosed) win.winClosed(close);
			});

      window.xen.apps.fileApps.forEach((app, index) => {
        if (app[1].name==close.detail.text) {
          window.xen.apps.fileApps.splice(index, 1);

          window.xen.dock.quit(app[0]);
        }
      });
		});
	}

	load(name, script = "", path, _name = "") {
		{
			eval(`
(function(name, path, _name) {
	${script}
})("${name}", "${path}", "${_name}");
      `);
		}
	}
};
