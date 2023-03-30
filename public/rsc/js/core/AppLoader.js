const path = require("path-browserify");

// Electrode/App Communication APIs

window.__XEN_WEBPACK.winRaw = [];

var appWin = class WIN {
  listeners = [];

  constructor(options = {}, name, path, _xen) {
    var that = this;
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
        modules: []
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
      this.opts.width + "px",
      this.opts.height + "px"
    );

    if (this.opts.focus) window.xen.windowManager.focus(name);

    this.el = el;

    el.querySelector("iframe").addEventListener('load', 
function() {
      that.opts.modules.forEach(module => {
        that.send('__XEN_MODULE_CONNECTION', {name: module});
      });
    });
    this.registerMessages(el.querySelector("iframe").contentWindow);
  }
  registerMessages(win) {
    var that = this;

    window.addEventListener("message", (data, _origin) => {
      if (data.source == win) that.emit(data.data.message, ...data.data.data);
    });
  }
  winClosed(event) {
    if (this.opts.allCloseQuit && event.detail.text == this.name)
      this.xen.quit(this._name);
  }
  on(event, callback) {
    this.listeners.push([event, callback]);
  }
  emit(event, ...data) {
    this.listeners.filter((e) => e[0] == event).forEach((e) => e[1](...data));
  }
  once(event, callback) {
    callback = new Proxy(callback, {});

    this.listeners.push([event, callback]);
  }
  send(event, ...data) {
        this.el.querySelector("iframe").contentWindow.postMessage({
      message: event,
      data: data,
    });
  }

  loadURL(url) {
    return new Promise(resolve => {
                  document.getElementById(this.name).querySelector("iframe").onload = function() {
                    resolve();
                  }
      document.getElementById(this.name).querySelector("iframe").src = url;
    });
  }
  loadFile(url) {
    return new Promise(resolve => {
      var _path = path.join(this.path, url);
  
      fetch(_path)
        .then((e) => e.text())
        .then((e) => {
                  document.getElementById(this.name).querySelector("iframe").onload = function() {
                    resolve();
                  }
          
          document.getElementById(this.name).querySelector("iframe").src = _path;
        });
    });
  }
  requestFileSystem() {
    //const flag = this.name + "_permission_filesystem";
  }
  executeJavascript(code = "") {
    // TODO: remove?
    this.el.querySelector("iframe").contentWindow.postMessage({
      message: "__XEN_LISTENER_CONNECTION_MANAGER",
      data: ["executeJS", code],
    });
  }
  requestDispatchNotification(notificationName, body, image) {
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
          xen.notification.dispatch(notificationName, body, image);
        }, 600);
      } else {
        console.log("permission refused");
      }
      xen.browserTool.fullscreen();
    } else if (permCheck === "true") {
      xen.notification.dispatch(notificationName, body, image);
    }
  }
  retractNotification(id) {
    xen.notification.retract(id);
  }

  openNewWindow(childName, location) {
    console.log(childName, location);
    xen.windowManager.modWin(this.name, "child_processes", location);
    xen.system.register(childName, "0", "0", location);
  }
  launch(address){
    xen.windowManager.modWin(this.name, "opener", true);
    try {
     xen.apps.launch(address)
    } catch (e){
      console.log(e)
    }

  }
  requestFileSystemPermission(){
    const flag = this.name + "_permission_FS";
    console.log(flag);
    var permCheck = localStorage.getItem(flag);
      if (permCheck == null || permCheck == undefined || permCheck == false) {
          const requestMessage = confirm(
        this.name +
          " Wants permission to access Filesystem. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"
      );
      if (requestMessage == true) {
        console.log("Permission granted");
        localStorage.setItem(flag, "true");
        
      }
      
      }
  }
  writeFile(name, cont){
      const flag = this.name + "_permission_FS";
     var permCheck = localStorage.getItem(flag);
      if (permCheck == null || permCheck == undefined || permCheck == false) {
        return
      } else {
         xen.fs.writeFile(name, cont)
      }
   
  }
readFile(file){
  var result; 
 xen.fs.readFile(file).then((m) => {
   result = m;
    return result;
})
  return result;
}
  requestModifySetting(settingFlag, setting) {
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

        if (settingFlag === "backdrop") {
          xen.settings.setBg(xen.settings.background[setting]);
        }

        if (settingFlag == "customBackdrop") {
          xen.settings.setCustomBg(setting);
        }

        localStorage.setItem(flag, "true");
      } else {
        console.log("permission denied");
      }
    } else if (permCheck === "true") {
      if (settingFlag === "backdrop") {
        xen.settings.setBg(xen.settings.background[setting]);
      }
      if (settingFlag == "customBackdrop") {
        xen.settings.setCustomBg(setting);
      }
    }
  }

  RequestGetAllApps() {
    const all = xen.apps.apps.appsInstalled;
    var response = false;
    const flag = this.name + "_permission_getApps";
    var permCheck = localStorage.getItem(flag);
    console.log(permCheck);
    if (permCheck == null || permCheck == undefined || permCheck == false) {
      const requestMessage = confirm(
        this.name +
          " Wants permission to see which apps are installed. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"
      );

      if (requestMessage == true) {
        console.log("Permission granted");
        localStorage.setItem(flag, "true");
        response = all;
      } else if (requestMessage == false) {
        localStorage.setItem(flag, "false");
        response = "denied";
      }
    } else if (permCheck === "true") {
      response = all;
    }
    return response;
  }

  //end func list
};

var _NativeWindow = class NATWIN {
  // Some native windows need to be converted in order to work with the API
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
      window.__XEN_WEBPACK.winRaw.forEach((win) => {
        if (win.winClosed) win.winClosed(close);
      });

      window.xen.apps.fileApps.forEach((app, index) => {
        if (app[1].name == close.detail.text) {
          window.xen.apps.fileApps.splice(index, 1);

          window.xen.dock.quit(app[0]);
        }
      });
    });
  }

  load(name, script = "", path, _name = "") {
    try {
      // Scoping for variables and easy app launching
      eval(`
(function(name, path, _name) {
	${script}
})("${name}", "${path}", "${_name}");
      `);
    } catch(e) {
      console.error(e);
    }
  }
};
