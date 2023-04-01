// OS MotherBoard API (asus z790)
window.__XEN_WEBPACK.core.OS = class OS {
  Native = (a) => Boolean(a.match(/^Xen\//g));

  constructor() {
    this.fs = new window.__XEN_WEBPACK.core.VFS();
    this.windowManager = new window.__XEN_WEBPACK.WindowManager();
    this.system = new window.__XEN_WEBPACK.core.System();
    this.browserTool = new window.__XEN_WEBPACK.core.browser();
    this.notification = new window.__XEN_WEBPACK.core.NotificationComponent();
    this.apps = new window.__XEN_WEBPACK.core.AppManagerComponent();
    this.logger = new window.__XEN_WEBPACK.core.LoggerComponent();
    this.apps.loader = new window.__XEN_WEBPACK.core.AppLoaderComponent();
    this.dock = new window.__XEN_WEBPACK.core.DockComponent(this.fs);
    this.settings = new window.__XEN_WEBPACK.core.SettingsComponent();
    this.x86 = new window.__XEN_WEBPACK.core.x86EngineComponent();
    this.terminal = new window.__XEN_WEBPACK.core.TerminalEngineComponent();
    this.error = new window.__XEN_WEBPACK.core.ErrorComponent();
    this.desktop = new window.__XEN_WEBPACK.core.DesktopComponent(this.fs);
    this.ContextMenu = window.__XEN_WEBPACK.core.ContextMenu;
    this.information = { version: 0.8, releaseName: "solace" };
  }
};

Object.defineProperty(window, "xen", {
  configurable: false,
  value: new window.__XEN_WEBPACK.core.OS(),
});
