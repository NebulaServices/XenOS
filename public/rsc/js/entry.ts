// @ts-nocheck

window.__XEN_WEBPACK = { core: {}, html: {} };


// Core
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

// After
var LeaderComponent = require("./index");
var SetupComponent = require("./setup");
var MarkupOrganizer = require("./markup");
var BatteryComponent = require("./battery");
var dragComponent = require("./draggable");

var PreloadComponent = require("./preload")();