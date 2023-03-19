// WindowManager SubAPI
window.__XEN_WEBPACK.WindowManager = class WindowManager {
	constructor() {
		this.windows = {};
		this.maximizedWindow = { name: null };
		this.activeWindow = { active: "null" };
		this.windowDrag = { drag: false };
	}

	focus(appName) {
		this.activeWindow.active = appName;

    window.xen.windowManager.handleWindowClick(document.getElementById(appName));
	}

	addWindow(id, el, ...props) {
		const windowProps = { el };

		if (props.pop() == true) windowProps.native = true;

		Object.defineProperty(windowProps, "locX", {
			get() {
				return windowProps._locX;
			},
			set(val) {
				windowProps._locX = val;
				el.style.left = val;
			},
		});
		Object.defineProperty(windowProps, "locY", {
			get() {
				return windowProps._locY;
			},
			set(val) {
				windowProps._locY = val;
				el.style.top = val;
			},
		});

		for (let i = 0; i < props.length; i += 2) {
			windowProps["_" + props[i]] = props[i + 1];
		}

		this.windows[id] = windowProps;
	}
	removeWindow(id) {
		if (this.windows[id]) {
			delete this.windows[id];
		}
	}
	modWin(id, prop, value) {
		if (this.windows[id]) {
			this.windows[id][prop] = value;
		}
	}
	getZIndex(id) {
		if (this.windows[id]) {
			return this.windows[id].zIndex;
		}
	}

	getLocation(id) {
		if (this.windows[id]) {
			const { locX, locY } = this.windows[id];

			const locationConcat = `X: ${locX.replace(
				"px",
				""
			)} , Y: ${locY.replace("px", "")}`;
			return locationConcat;
		}
	}

	getElement(id) {
		return this.windows[id].el;
	}
};
