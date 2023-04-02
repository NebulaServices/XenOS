// WindowManager SubAPI
window.__XEN_WEBPACK.WindowManager = class WindowManager {
	constructor() {
		this.windows = new Map();
		this.maximizedWindow = { name: null };
		this.activeWindow = { active: "null" };
		this.windowDrag = { drag: false };
		this.processes = new Map();
		this.processID = 0;
	}

	focus(appName) {
		this.activeWindow.active = appName;
		window.xen.windowManager.handleWindowClick(document.getElementById(appName));
	}

	spawnProcess(id, el, ...props) {
  if (this.windows.has(id)) {
    id = id + '-' + Date.now();
    console.warn(`Window with ID ${id} already exists. Creating new window with ID ${id} instead.`);
  }

  const windowProps = { el, processID: this.processID++ };

  if (props.pop()) windowProps.native = true;

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

  this.windows.set(id, windowProps);
  this.processes.set(windowProps.processID, windowProps);
    
  return id;
}




	removeWindow(id) {
		if (this.windows.has(id)) {
			const windowProps = this.windows.get(id);
			this.windows.delete(id);
			this.processes.delete(windowProps.processID);
		}
	}

	modWin(id, prop, value) {
		if (this.windows.has(id)) {
			this.windows.get(id)[prop] = value;
		}
	}

	getProcess(id) {
		return this.processes.get(id);
	}

	getZIndex(id) {
		if (this.windows.has(id)) {
			return this.windows.get(id).zIndex;
		}
	}

	getLocation(id) {
		if (this.windows.has(id)) {
			const { locX, locY } = this.windows.get(id);
			const locationConcat = `X: ${locX.replace("px", "")} , Y: ${locY.replace("px", "")}`;
			return locationConcat;
		}
	}

	getElement(id) {
		return this.windows.get(id).el;
	}
};
