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

    this.el = xen.system.register(
      name,
      this.opts.x + "px",
      this.opts.y + "px",
      undefined,
      false,
      this.opts.width + "px",
      this.opts.height + "px"
    );

    if (this.opts.focus) window.xen.windowManager.focus(name);

    this.el.querySelector("iframe").addEventListener('load', 
function() {
      that.opts.modules.forEach(module => {
        that.send('__XEN_MODULE_CONNECTION', {name: module});
      });
    });
    
    this.registerMessages(this.el.querySelector("iframe").contentWindow);
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
  
  getAllWindows() {
    return Object.entries(xen.windowManager.windows).map(([name, window]) => {
      return window.native ? new _NativeWindow(window) : window;
    });
  };

  loadURL(url) {
    return new Promise(resolve => {
      document.getElementById(this.name).querySelector("iframe").onload = function() {
        resolve();
      }
      document.getElementById(this.name).querySelector("iframe").src = url;
    });
  }
  loadFile(url) {
    return new Promise(async resolve => {
      var _path = path.join(this.path, url);
      document.getElementById(this.name).querySelector("iframe").onload = function() {
        resolve();
      }
          
      document.getElementById(this.name).querySelector("iframe").src = _path;
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
    const response = this.#requestPermission('notify', this.name + " Wants permission to send in-OS notifications. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
    
    if (response) {
      xen.browserTool.fullscreen();
      xen.notification.dispatch(notificationName, body, image);
    }

    return response;
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
    return this.#requestPermission('FS', this.name + " Wants permission to access the FileSystem. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
  }
  
  async writeFile(name, cont){
    const response = this.#requestPermission('FS', this.name + " Wants permission to access the FileSystem. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
    
    if (response) {
      return await xen.fs.writeFile(name, cont);
    }
  }
  
  async readFile(file){
    return await xen.fs.readFile(file);
  }
  
  requestModifySetting(settingFlag, setting) {
    var response = this.#requestPermission('settingF', this.name + " Wants permission to modify settings. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
    
    if (response) {
      if (settingFlag === "backdrop") {
        xen.settings.setBg(xen.settings.background[setting]);
      }
      if (settingFlag == "customBackdrop") {
        xen.settings.setCustomBg(setting);
      }
    }

    return response;
  }

  RequestGetAllApps() {
    const all = xen.apps.apps.appsInstalled;
    const response = this.#requestPermission('getApps', this.name + " Wants permission to see which apps are installed. \n 'OK' to Grant permissions \n 'cancel' to deny the permission");
    
    if (response) {
      response = all;
    } else response = false;
    
    return response;
  }

  #requestPermission(flag, message) {
    var flag = this.name + '_permission_'+flag;

    if (localStorage.getItem(flag)) {
      if (localStorage.getItem(flag)=='true') return true;
    }

    var check = confirm(
      message
    );

    localStorage.setItem(flag, check.toString());

    return check;
  }
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