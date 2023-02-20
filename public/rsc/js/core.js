// OS MotherBoard API
window.__XEN_WEBPACK.core.OS = class OS {
	constructor() {
		this.fs = new window.__XEN_WEBPACK.core.VFS();
		this.windowManager = new window.__XEN_WEBPACK.WindowManager();
		this.system = new window.__XEN_WEBPACK.core.System();
		this.browserTool = new window.__XEN_WEBPACK.core.browser();
		this.notification =
			new window.__XEN_WEBPACK.core.NotificationComponent();
		this.apps = new window.__XEN_WEBPACK.core.AppManagerComponent();
		this.logger = new window.__XEN_WEBPACK.core.LoggerComponent();
		this.apps.loader = new window.__XEN_WEBPACK.core.AppLoaderComponent();
		this.dock = new window.__XEN_WEBPACK.core.DockComponent(this.fs);
		this.settings = new window.__XEN_WEBPACK.core.SettingsComponent();
	}
};

Object.defineProperty(window, "xen", {
	configurable: false,
	value: new window.__XEN_WEBPACK.core.OS(),
});
