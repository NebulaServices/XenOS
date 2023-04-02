// @ts-nocheck

window.__XEN_WEBPACK = { core: {}, html: {} };


// Core
var checkup = require('./checkup.js')
var FileSystemComponent = require("./vfs");
var SettingsComponent = require("./settings");
var DockComponent = require("./dock");
var LoggerSystemComponent = require("./core/logger");
var AppManagerComponent = require("./core/AppManager");
var AppLoaderComponent = require("./core/AppLoader");
var BrowserTool = require("./core/BrowserTool");
var NotificationComponent = require("./core/NotificationComponent");
var NotificationComponent = require("./core/System");
var ErrorComponent = require("./core/ErrorManager");
var WindowManager = require("./core/WindowManager");
var MotherBoardComponent = require("./x86");
var TerminalBoard = require("./xterminal");
var DesktopComponent = require('./core/Desktop');

var MotherBoardComponent = require("./core");

// Frameworks 


// After
var LeaderComponent = require("./index");
var SetupComponent = require("./setup");
var MarkupOrganizer = require("./markup");
var BatteryComponent = require("./battery");
var dragComponent = require("./draggable");

var PreloadComponent = require("./preload");

navigator.serviceWorker.register("/sw.js", {
	scope: "/",
});

window.onbeforeunload = event => {
	console.log("Attempted Close");

	event.preventDefault();
	event.returnValue = false;
	return false;
};
