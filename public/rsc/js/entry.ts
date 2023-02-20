// @ts/nocheck

window.__XEN_WEBPACK = { core: {}, html: {} };

// Core
var FileSystemComponent = require("./vfs.ts");
var SettingsComponent = require("./settings.ts");
var DockComponent = require("./dock.js");
var LoggerSystemComponent = require("./core/logger.js");
var AppManagerComponent = require("./core/AppManager.js");
var AppLoaderComponent = require("./core/AppLoader.js");
var BrowserTool = require("./core/BrowserTool.js");
var NotificationComponent = require("./core/NotificationComponent.js");
var NotificationComponent = require("./core/System.js");
var WindowManager = require("./core/WindowManager.js");
var MotherBoardComponent = require("./core.js");

// After
var PreloadComponent = require("./preload.js");
var LeaderComponent = require("./index.js");
var SetupComponent = require("./setup.js");
var MarkupOrganizer = require("./markup.js");
var BatteryComponent = require("./battery.js");
var dragComponent = require("./draggable.js");

navigator.serviceWorker.register("/sw.js", {
	scope: "/",
});

window.onbeforeunload = event => {
	console.log("Attempted Close");

	event.preventDefault();
	event.returnValue = false;
	return false;
};
