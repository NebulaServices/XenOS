// @ts/nocheck

window.__XEN_WEBPACK = { core: {}, html: {} };

var PreloadComponent = require("./preload.js");
var FileSystemComponent = require("./vfs.ts");
var SettingsComponent = require("./settings.js");
var AppManagerComponent = require("./AppManager.js");
var AppLoaderComponent = require("./AppLoader.js");
var DockComponent = require("./dock.js");
var LoggerSystemComponent = require("./logger.js");
var MotherBoardComponent = require("./core.js");
var LeaderComponent = require("./index.js");
var SetupComponent = require("./setup.js");
var MarkupOrganizer = require("./markup.js");
var BatteryComponent = require("./battery.js");
var dragComponent = require("./draggable.js");

navigator.serviceWorker.register("/sw.js", {
	scope: "/",
});

window.onbeforeunload = function(event) {
  console.log('Attempted Close');
  
  event.preventDefault();
  event.returnValue = false;
  return false;
}