// @ts-nocheck

window.__XEN_WEBPACK.core.SettingsComponent = class SystemSettings {
	constructor() {
		this.settings = { _background: "default", colorMode: "light" };
		this.background = {
			default: "fruity-bg.png",
			forest: "bg2.jpg",
		};

    // for now

    this.setBg(this.background[localStorage.getItem('xen-bg')||'default']);
	}
	setBg(name: string) {
		document.querySelector(
			".os-body"
		).style.background = `url("https://xenos-dev.greenworldia.repl.co/rsc/img/${name}")`;
	}
};
