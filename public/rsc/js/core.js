
const xen = window.__XEN_WEBPACK;
const core = xen.core;
xen.core.OS = class OS {
  Native = a => Boolean(a.match(/^Xen\//g));
  
  constructor() {
    this.fs = new xen.core.VFS();
    this.windowManager = new xen.WindowManager();
    this.system = new xen.core.System();
    this.browserTool = new xen.core.browser();
    this.notification = new xen.core.NotificationComponent();
    this.apps = new xen.core.AppManagerComponent();
    this.logger = new xen.core.LoggerComponent();
    this.apps.loader = new xen.core.AppLoaderComponent();
    this.dock = new xen.core.DockComponent(this.fs);
    this.settings = new xen.core.SettingsComponent();
    this.x86 = new xen.core.x86EngineComponent();
    this.terminal = new xen.core.TerminalEngineComponent();
    this.error = new xen.core.ErrorComponent();
    this.desktop = new xen.core.DesktopComponent(this.fs);
    this.information = {"version":0.8, "releaseName":"solace"};
  }
};


Object.defineProperty(window, "xen", {
	configurable: false,
	value: new xen.core.OS(),
  });