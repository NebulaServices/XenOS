window.__XEN_WEBPACK.winRaw = [];

var _window = class WIN {
  listeners = [];
  registerMessages(win) {
    var that = this;
    
    window.addEventListener('message', function(data, origin) {
      if (data.source==win) {
        that.emit(data.data.message, ...data.data.data);
      }
    });
  }

  winClosed(event) {
    console.log(event)
    if (this.opts.allCloseQuit&&event.detail.text==this.name) {
      return this.xen.quit(this._name);
    } 
  }
  
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
        allCloseQuit: false,
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
			false
		);

    this.el = el;

    this.registerMessages(el.querySelector('iframe').contentWindow);

    el.style.width = options.width+'px';
    el.style.height = options.height+'px';
	}
  on(event, callback) {
    this.listeners.push([event, callback]);
  }
  emit(event, ...data) {
    this.listeners.filter(e=>e[0]==event).forEach(e=>e[1](...data));
  }
  once(event, callback) {
    callback = new Proxy(callback, {
      
    });
    
    this.listeners.push([event, callback]);
  }

	loadURL(url) {
		document.getElementById(this.name).querySelector("iframe").src = url;
	}
	loadFile(url) {
    var path = this.path+'/'+url
    fetch(path).then(e=>e.text()).then(e=>{
      document.getElementById(this.name).querySelector("iframe").src = path;
    });
  }
  requestFileSystem(){
      const flag = this.name+'_permission_filesystem';
  }
  executeJavascript(code = '') {
    this.el.querySelector('iframe').contentWindow.postMessage({message: '__XEN_LISTENER_CONNECTION_MANAGER', data: {type: 'executeJS', code}});

    
  }
  requestDispatchNotification(notificationName, body) {
    const flag = this.name+'_permission_notify';
    console.log(flag)
    var permCheck = localStorage.getItem(flag)
    console.log(permCheck)
    if (permCheck == null || permCheck == undefined || permCheck == false) {
      xen.browserTool.fullscreen()
      const requestMessage = confirm(this.name + " Wants permission to send in-OS notifications. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
    if (requestMessage == true) {
        console.log('Permission granted')
      localStorage.setItem(flag, 'true')
      setTimeout(function () {
          xen.notification.dispatch(notificationName, body) 
      }, 600)
  
          }
    else {
       console.log('permission refused')
  }
      xen.browserTool.fullscreen()
    } else if(permCheck === "true") {
xen.notification.dispatch(notificationName, body) 
    }
  }
};

var _NativeWindow = class NATWIN {
	constructor(window) {
		this.raw = window;
	}

	getBounds() {
		return {
			x: this.raw.location_x,
			y: this.raw.location_y,
			width: this.raw.el.offsetWidth,
			height: this.raw.el.offsetHeight,
		};
	}
};

_window.getAllWindows = function () {
	return Object.entries(xen.windowManager.windows).map(([name, window]) => {
		return window.native ? new _NativeWindow(window) : window;
	});
};

window.__XEN_WEBPACK.core.AppLoaderComponent = class ALC {
	window = _window;
	constructor() {
    document.addEventListener('WindowClose', function(ev) {
      window.__XEN_WEBPACK.winRaw.forEach(e=>{
        if (e.winClosed) e.winClosed(ev);
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
