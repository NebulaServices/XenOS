/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./public/rsc/js/entry.ts":
/*!********************************!*\
  !*** ./public/rsc/js/entry.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("window.__XEN_WEBPACK = { core: {}, html: {} };\nvar PreloadComponent = __webpack_require__(/*! ./preload.js */ \"./public/rsc/js/preload.js\");\nvar FileSystemComponent = __webpack_require__(/*! ./vfs.ts */ \"./public/rsc/js/vfs.ts\");\nvar AppManagerComponent = __webpack_require__(/*! ./AppManager.js */ \"./public/rsc/js/AppManager.js\");\nvar CoreScriptComponent = __webpack_require__(/*! ./core.js */ \"./public/rsc/js/core.js\");\nvar LeaderComponent = __webpack_require__(/*! ./index.js */ \"./public/rsc/js/index.js\");\nvar SetupComponent = __webpack_require__(/*! ./setup.js */ \"./public/rsc/js/setup.js\");\nvar BatteryComponent = __webpack_require__(/*! ./battery.js */ \"./public/rsc/js/battery.js\");\nvar dragComponent = __webpack_require__(/*! ./draggable.js */ \"./public/rsc/js/draggable.js\");\n// var PredictionAlgorithmComponent = require('./predict.js')\n// var ToolTipLibrary = require('tippy.js');\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/entry.ts?");

/***/ }),

/***/ "./public/rsc/js/vfs.ts":
/*!******************************!*\
  !*** ./public/rsc/js/vfs.ts ***!
  \******************************/
/***/ (function() {

eval("var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nvar __generator = (this && this.__generator) || function (thisArg, body) {\n    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;\n    return g = { next: verb(0), \"throw\": verb(1), \"return\": verb(2) }, typeof Symbol === \"function\" && (g[Symbol.iterator] = function() { return this; }), g;\n    function verb(n) { return function (v) { return step([n, v]); }; }\n    function step(op) {\n        if (f) throw new TypeError(\"Generator is already executing.\");\n        while (g && (g = 0, op[0] && (_ = 0)), _) try {\n            if (f = 1, y && (t = op[0] & 2 ? y[\"return\"] : op[0] ? y[\"throw\"] || ((t = y[\"return\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;\n            if (y = 0, t) op = [op[0] & 2, t.value];\n            switch (op[0]) {\n                case 0: case 1: t = op; break;\n                case 4: _.label++; return { value: op[1], done: false };\n                case 5: _.label++; y = op[1]; op = [0]; continue;\n                case 7: op = _.ops.pop(); _.trys.pop(); continue;\n                default:\n                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }\n                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }\n                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }\n                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }\n                    if (t[2]) _.ops.pop();\n                    _.trys.pop(); continue;\n            }\n            op = body.call(thisArg, _);\n        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }\n        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };\n    }\n};\nvar __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {\n    if (kind === \"a\" && !f) throw new TypeError(\"Private accessor was defined without a getter\");\n    if (typeof state === \"function\" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError(\"Cannot read private member from an object whose class did not declare it\");\n    return kind === \"m\" ? f : kind === \"a\" ? f.call(receiver) : f ? f.value : state.get(receiver);\n};\nvar _instances, _cleanName, _getPath, _getDir, _getFile, _a;\nwindow.__XEN_WEBPACK.core.VFS = (_a = /** @class */ (function () {\n        function class_1() {\n            _instances.add(this);\n        }\n        // API\n        class_1.prototype.writeFile = function (path, msg) {\n            return __awaiter(this, void 0, void 0, function () {\n                var _a, fileName, dirName, handle;\n                return __generator(this, function (_b) {\n                    switch (_b.label) {\n                        case 0:\n                            _a = __classPrivateFieldGet(this, _instances, \"m\", _getPath).call(this, path), fileName = _a.fileName, dirName = _a.dirName;\n                            return [4 /*yield*/, __classPrivateFieldGet(this, _instances, \"m\", _getFile).call(this, dirName, fileName)];\n                        case 1:\n                            handle = _b.sent();\n                            handle.createWritable();\n                            return [2 /*return*/];\n                    }\n                });\n            });\n        };\n        class_1.prototype.getFile = function (path) {\n            return __awaiter(this, void 0, void 0, function () {\n                var _a, fileName, dirName, file;\n                return __generator(this, function (_b) {\n                    switch (_b.label) {\n                        case 0:\n                            _a = __classPrivateFieldGet(this, _instances, \"m\", _getPath).call(this, path), fileName = _a.fileName, dirName = _a.dirName;\n                            return [4 /*yield*/, __classPrivateFieldGet(this, _instances, \"m\", _getFile).call(this, dirName, fileName, false)];\n                        case 1: return [4 /*yield*/, (_b.sent()).getFile()];\n                        case 2:\n                            file = _b.sent();\n                            return [2 /*return*/];\n                    }\n                });\n            });\n        };\n        class_1.prototype.mkdir = function (path) {\n            return __awaiter(this, void 0, void 0, function () {\n                var dirName;\n                return __generator(this, function (_a) {\n                    switch (_a.label) {\n                        case 0:\n                            dirName = __classPrivateFieldGet(this, _instances, \"m\", _getPath).call(this, path).dirName;\n                            return [4 /*yield*/, __classPrivateFieldGet(this, _instances, \"m\", _getDir).call(this, path)];\n                        case 1:\n                            _a.sent();\n                            return [2 /*return*/];\n                    }\n                });\n            });\n        };\n        class_1.prototype.remove = function (path) {\n            return __awaiter(this, void 0, void 0, function () {\n                var _a, fileName, dirName, dir;\n                return __generator(this, function (_b) {\n                    switch (_b.label) {\n                        case 0:\n                            _a = __classPrivateFieldGet(this, _instances, \"m\", _getPath).call(this, path), fileName = _a.fileName, dirName = _a.dirName;\n                            return [4 /*yield*/, __classPrivateFieldGet(this, _instances, \"m\", _getDir).call(this, dirName)];\n                        case 1:\n                            dir = _b.sent();\n                            return [4 /*yield*/, dir.removeEntry(fileName, {\n                                    recursive: true\n                                })];\n                        case 2:\n                            _b.sent();\n                            return [2 /*return*/];\n                    }\n                });\n            });\n        };\n        return class_1;\n    }()),\n    _instances = new WeakSet(),\n    _cleanName = function _cleanName(name) {\n        // Don't let the user write zalgo characters\n        return name.replace(/[^a-zA-Z\\_\\-\\.]/g, \"\");\n    },\n    _getPath = function _getPath(path) {\n        var _a, _b;\n        var split = path.split(\"/\");\n        var file = (_a = split.pop()) !== null && _a !== void 0 ? _a : \"\";\n        var dir = (_b = split.join()) !== null && _b !== void 0 ? _b : \"\";\n        return {\n            dirName: __classPrivateFieldGet(this, _instances, \"m\", _cleanName).call(this, dir),\n            fileName: __classPrivateFieldGet(this, _instances, \"m\", _cleanName).call(this, file)\n        };\n    },\n    _getDir = function _getDir(dirName, create) {\n        if (create === void 0) { create = true; }\n        return __awaiter(this, void 0, void 0, function () {\n            var root;\n            return __generator(this, function (_a) {\n                switch (_a.label) {\n                    case 0: return [4 /*yield*/, navigator.storage.getDirectory()];\n                    case 1:\n                        root = _a.sent();\n                        if (dirName === \"\")\n                            return [2 /*return*/, root];\n                        return [4 /*yield*/, root.getDirectoryHandle(dirName, {\n                                create: create\n                            })];\n                    case 2: return [2 /*return*/, _a.sent()];\n                }\n            });\n        });\n    },\n    _getFile = function _getFile(dirName, fileName, create) {\n        if (create === void 0) { create = true; }\n        return __awaiter(this, void 0, void 0, function () {\n            var dir, handle;\n            return __generator(this, function (_a) {\n                switch (_a.label) {\n                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _instances, \"m\", _getDir).call(this, dirName)];\n                    case 1:\n                        dir = _a.sent();\n                        return [4 /*yield*/, dir.getFileHandle(fileName, {\n                                create: create\n                            })];\n                    case 2:\n                        handle = _a.sent();\n                        return [2 /*return*/, handle];\n                }\n            });\n        });\n    },\n    _a);\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/vfs.ts?");

/***/ }),

/***/ "./public/rsc/js/AppManager.js":
/*!*************************************!*\
  !*** ./public/rsc/js/AppManager.js ***!
  \*************************************/
/***/ (() => {

eval("window.__XEN_WEBPACK.core.AppManagerComponent = class AMC {\n\tconstructor() {\n\t\tthis.apps = { installed: \"\" };\n\t\tthis.permissions = { typeSetter: false };\n\t}\n};\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/AppManager.js?");

/***/ }),

/***/ "./public/rsc/js/battery.js":
/*!**********************************!*\
  !*** ./public/rsc/js/battery.js ***!
  \**********************************/
/***/ (() => {

eval("console.log(\"Battery component loaded\");\nfunction calculateBatWid(life) {\n\t// turn percent into an integer\n\tconst _numDecimal = parseFloat(life) / 100;\n\tconst batLifeNum = _numDecimal * 100;\n\tconst batLife_nonPol = batLifeNum * 2;\n\tconst batLife = batLife_nonPol + 10;\n\treturn batLife;\n}\n\nfunction batToNum(life) {\n\tconst _numDecimal = parseFloat(life) / 100;\n\tconst batLifeNum = _numDecimal * 100;\n\treturn batLifeNum;\n}\nnavigator.getBattery().then(battery => {\n\tconst bar = document.getElementById(\"os-battery-bar\");\n\tconst widget = document.getElementById(\"battery\");\n\ttry {\n\t\taddEventListener(\"DOMContentLoaded\", event => {\n\t\t\tif (batToNum(xen.system.battery()) < 15) {\n\t\t\t\tbar.style.width = calculateBatWid(xen.system.battery());\n\t\t\t\tbar.style.fill = \"#ff4040\";\n\t\t\t\txen.notification.dispatch(\n\t\t\t\t\t\"Low Battery\",\n\t\t\t\t\t\"Your devices battery is running low.\"\n\t\t\t\t);\n\t\t\t} else {\n\t\t\t\tbar.style.width = calculateBatWid(xen.system.battery());\n\t\t\t\tbar.style.fill = \"#fff\";\n\t\t\t}\n\n\t\t\tbattery.onlevelchange = event => {\n\t\t\t\tif (batToNum(xen.system.battery()) < 15) {\n\t\t\t\t\tbar.style.width = calculateBatWid(xen.system.battery());\n\t\t\t\t\tbar.style.fill = \"#ff4040\";\n\t\t\t\t\txen.notification.dispatch(\n\t\t\t\t\t\t\"Low Battery\",\n\t\t\t\t\t\t\"Your devices battery is running low.\"\n\t\t\t\t\t);\n\t\t\t\t} else {\n\t\t\t\t\tbar.style.width = calculateBatWid(xen.system.battery());\n\t\t\t\t\tbar.style.fill = \"#fff\";\n\t\t\t\t}\n\t\t\t};\n\t\t});\n\t\tbatteryIsCharging = battery.charging;\n\t\txen.system.battery = () => `${battery.level * 100}%`;\n\t} catch (e) {\n\t\tconsole.error(\n\t\t\t\"An error occured while trying to get battery readings: \\n\" + e\n\t\t);\n\t\tbar.style.fill = \"#ff4040\";\n\t}\n});\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/battery.js?");

/***/ }),

/***/ "./public/rsc/js/core.js":
/*!*******************************!*\
  !*** ./public/rsc/js/core.js ***!
  \*******************************/
/***/ (() => {

eval("const os_desk = document.getElementById(\"os-desktop\");\n\nos_desk.addEventListener(\"NewWindow\", function (e) {\n\tconsole.log(`${e.detail.text} ${e.window} ${e}`);\n});\nconsole.log(\"Loaded CORESRC\");\n\n// INTERNAL USE\nwindow.__XEN_WEBPACK.core.browser = class BrowserTool {\n\tconstructor() {}\n\tfullscreen() {\n\t\tif (\n\t\t\t(document.fullScreenElement &&\n\t\t\t\tdocument.fullScreenElement !== null) ||\n\t\t\t(!document.mozFullScreen && !document.webkitIsFullScreen)\n\t\t) {\n\t\t\tif (document.documentElement.requestFullScreen) {\n\t\t\t\tdocument.documentElement.requestFullScreen();\n\t\t\t} else if (document.documentElement.mozRequestFullScreen) {\n\t\t\t\tdocument.documentElement.mozRequestFullScreen();\n\t\t\t} else if (document.documentElement.webkitRequestFullScreen) {\n\t\t\t\tdocument.documentElement.webkitRequestFullScreen(\n\t\t\t\t\tElement.ALLOW_KEYBOARD_INPUT\n\t\t\t\t);\n\t\t\t}\n\t\t} else {\n\t\t\tif (document.cancelFullScreen) {\n\t\t\t\tdocument.cancelFullScreen();\n\t\t\t} else if (document.mozCancelFullScreen) {\n\t\t\t\tdocument.mozCancelFullScreen();\n\t\t\t} else if (document.webkitCancelFullScreen) {\n\t\t\t\tdocument.webkitCancelFullScreen();\n\t\t\t}\n\t\t}\n\t}\n};\n\n// System SubAPI\nwindow.__XEN_WEBPACK.core.System = class System {\n\tconstructor() {}\n\n\tbegin() {\n\t\tconsole.log(\"Initializing XenOS\");\n\t\tconsole.log(\"Getting Windows\");\n\t\tconst windowData = xen.windowManager.windows;\n\t\tlocalStorage.setItem(\"xen_window_data\", JSON.stringify(windowData));\n\t\tconst inStorageWindowData_Debug =\n\t\t\tlocalStorage.getItem(\"xen_window_data\");\n\t\tconsole.log(\"Stored Window Data\", inStorageWindowData_Debug);\n\t\tconsole.log(\"Registering Capture\");\n\t\tconsole.log(\"Registering windowManager\");\n\t\tconsole.log(\"Inserting DefaultWindow\");\n\n\t\tconst os_desk = document.getElementById(\"os-desktop\");\n\t\tos_desk.innerHTML += `<div id='defaultWindow' class=\"drag box\" style='width: 613px; height: 518px; z-index:10;top: 78px;' onclick='const thisAppName = this.dataset.appname; xen.windowManager.focus(thisAppName);\nconsole.log(thisAppName);xen.windowManager.modifyWindow(thisAppName, \"zIndex\", this.style.zIndex);xen.windowManager.modifyWindow(thisAppName, \"location_x\", this.style.left);xen.windowManager.modifyWindow(thisAppName, \"location_y\", this.style.top);' data-appname='defaultWindow'>\n  <div class=\"box-header\">\n   <div class=\"box-header-title\">Welcome to XenOS :)   <span class='os-mini' \n onclick=' xen.windowManager.modifyWindow(\"defaultWindow\", \"minimized\", true);document.getElementById(\"defaultWindow\").style.display = \"none\"'> \n   <svg style=\"width: 12px;height: 15px;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"188\" height=\"185\" viewBox=\"0 0 188 185\" fill=\"none\">\n<rect width=\"188\" height=\"185\" rx=\"92.5\" fill=\"#FFD43C\"/>\n</svg>\n   </span><span class='os-exit' onclick='xen.system.unregister(\"defaultWindow\")'> <svg \nstyle=\"width: 12px;height: 15px;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"188\" height=\"185\" viewBox=\"0 0 188 185\" fill=\"none\">\n<rect width=\"188\" height=\"185\" rx=\"92.5\" fill=\"#F46868\"/>\n</svg></span> </div>\n    <div class='box-body-inner'>\n      <iframe src='./welcome.html'>  </iframe>\n</div></div></div> `;\n\n\t\txen.windowManager.addWindow(\n\t\t\t\"defaultWindow\",\n\t\t\tdocument.getElementById(\"defaultWindow\"),\n\t\t\t\"location_x\",\n\t\t\t\"0px\",\n\t\t\t\"location_y\",\n\t\t\t\"37px\"\n\t\t);\n\t\tconsole.log(\"Initialization complete\");\n\t\tconsole.log(\"Clearing Console\");\n\n\t\tsetTimeout(() => {\n\t\t\t// console.clear();\n\t\t\tconsole.log(\n\t\t\t\t\"%cWelcome to XenOS\",\n\t\t\t\t\"color:black;background-color:white;padding:5px;border-radius: 5px;line-height: 26px; font-size:30px;\"\n\t\t\t);\n\t\t}, 3000);\n\t\treturn true;\n\t}\n\n\tregister(appName, posX, posY, location) {\n\t\tlet check = document.getElementById(appName);\n\t\tif (check === null) {\n\t\t\tif ((appName, posX, posY == null)) {\n\t\t\t\tthrow new TypeError(\n\t\t\t\t\t\"Failed to register: \\n missing required arguments\"\n\t\t\t\t);\n\t\t\t} else {\n\t\t\t\t// Where a new app is created in the UI\n\t\t\t\tconst os_desk = document.getElementById(\"os-desktop\");\n\t\t\t\ttry {\n\t\t\t\t\tlet injectCode = `const thisAppName = this.dataset.appname; console.log(thisAppName);xen.windowManager.focus(thisAppName);xen.windowManager.modifyWindow(thisAppName, \"zIndex\", this.style.zIndex);xen.windowManager.modifyWindow(thisAppName, \"location_x\", this.style.left);xen.windowManager.modifyWindow(thisAppName, \"location_y\", this.style.top);`;\n\t\t\t\t\tlet closeCode = `xen.system.unregister(\"${appName}\")`;\n\t\t\t\t\tlet miniCode = `xen.windowManager.modifyWindow(\"${appName}\", \"minimized\", true);document.getElementById('${appName}').style.display = 'none'`;\n\t\t\t\t\tlet master = document.createElement(\"div\");\n\t\t\t\t\tlet headerBox = document.createElement(\"div\");\n\t\t\t\t\tlet headerTitle = document.createElement(\"div\");\n\t\t\t\t\tlet headerTitleText = document.createTextNode(appName);\n\t\t\t\t\tlet boxBody = document.createElement(\"div\");\n\t\t\t\t\tlet closeSpan = document.createElement(\"span\");\n\t\t\t\t\tlet miniSpan = document.createElement(\"span\");\n\t\t\t\t\tlet contentFrame = document.createElement(\"iframe\");\n\t\t\t\t\tmaster.dataset.appname = appName;\n\n\t\t\t\t\tmaster.classList.add(\"drag\");\n\t\t\t\t\tmaster.classList.add(\"box\");\n\t\t\t\t\tmaster.id = appName;\n\n\t\t\t\t\tos_desk.appendChild(master);\n\n\t\t\t\t\theaderBox.classList.add(\"box-header\");\n\t\t\t\t\theaderTitle.classList.add(\"box-header-title\");\n\t\t\t\t\tboxBody.classList.add(\"box-body-inner\");\n\t\t\t\t\tmaster.appendChild(headerBox);\n\t\t\t\t\theaderBox.appendChild(headerTitle);\n\n\t\t\t\t\theaderTitle.appendChild(headerTitleText);\n\t\t\t\t\theaderTitle.appendChild(closeSpan);\n\t\t\t\t\theaderTitle.appendChild(miniSpan);\n\t\t\t\t\tcloseSpan.classList.add(\"os-exit\");\n\t\t\t\t\tminiSpan.classList.add(\"os-mini\");\n\t\t\t\t\tcloseSpan.setAttribute(\"onclick\", closeCode);\n\t\t\t\t\tminiSpan.setAttribute(\"onclick\", miniCode);\n\t\t\t\t\tcloseSpan.innerHTML = `<svg style=\"width: 15px;height: 15px;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"188\" height=\"185\" viewBox=\"0 0 188 185\" fill=\"none\">\n<rect width=\"188\" height=\"185\" rx=\"92.5\" fill=\"#F46868\"></rect>\n</svg>`;\n\t\t\t\t\tminiSpan.innerHTML = `<svg style=\"width: 15px;height: 15px;\" xmlns=\"http://www.w3.org/2000/svg\" width=\"188\" height=\"185\" viewBox=\"0 0 188 185\" fill=\"none\">\n<rect width=\"188\" height=\"185\" rx=\"92.5\" fill=\"#FFD43C\"></rect>\n</svg>`;\n\t\t\t\t\theaderBox.appendChild(boxBody);\n\n\t\t\t\t\tboxBody.appendChild(contentFrame);\n\t\t\t\t\tcontentFrame.src = location;\n\t\t\t\t\tmaster.setAttribute(\"onclick\", injectCode);\n\t\t\t\t\tcontentFrame.contentWindow.addEventListener(\n\t\t\t\t\t\t\"error\",\n\t\t\t\t\t\tfunction (event) {\n\t\t\t\t\t\t\tconsole.log(\n\t\t\t\t\t\t\t\t\"An error occurred in the iframe:\",\n\t\t\t\t\t\t\t\tevent.message\n\t\t\t\t\t\t\t);\n\t\t\t\t\t\t}\n\t\t\t\t\t);\n\t\t\t\t\txen.windowManager.addWindow(\n\t\t\t\t\t\tappName,\n\t\t\t\t\t\tmaster,\n\t\t\t\t\t\t\"location_x\",\n\t\t\t\t\t\tposX,\n\t\t\t\t\t\t\"location_y\",\n\t\t\t\t\t\tposY\n\t\t\t\t\t);\n\t\t\t\t} catch (e) {\n\t\t\t\t\tconsole.log(\"Xen Registration Error: \\n\" + e);\n\t\t\t\t}\n\n\t\t\t\tos_desk.dispatchEvent(\n\t\t\t\t\tnew CustomEvent(\"NewWindow\", {\n\t\t\t\t\t\twindow: appName,\n\t\t\t\t\t\tdetail: { text: appName },\n\t\t\t\t\t})\n\t\t\t\t);\n\t\t\t}\n\t\t} else {\n\t\t\tif (xen.windowManager.windows[appName].minimized == true) {\n\t\t\t\tdocument.getElementById(appName).style.display = \"block\";\n\t\t\t\txen.windowManager.windows[appName].minimized = false;\n\t\t\t} else {\n\t\t\t\tthrow new TypeError(\n\t\t\t\t\t\"Failed to register: \\n An app or window with the same name already exists.\"\n\t\t\t\t);\n\t\t\t}\n\t\t}\n\t}\n\n\tunregister(appName) {\n\t\tlet win = document.getElementById(appName);\n\t\twin.innerHTML = \"\"; // clear the content of the div\n\t\twin.remove(); // remove the div from the DOM\n\t\txen.windowManager.removeWindow(appName);\n\t\tconsole.log(\"Sucessfully unregistered window: \" + appName);\n\t}\n\n\tlaunchpad(status) {\n\t\tconst lp = document.getElementById(\"launchpad-overlay\");\n\t\tif (status == true) {\n\t\t\tlp.style.display = \"flex\";\n\t\t} else {\n\t\t\tlp.style.display = \"none\";\n\t\t}\n\t}\n};\n\n// WindowManager SubAPI\nwindow.__XEN_WEBPACK.WindowManager = class WindowManager {\n\tconstructor() {\n\t\tthis.windows = {};\n\t\tthis.maximizedWindow = { name: null };\n\t\tthis.activeWindow = { active: \"null\" };\n\t\tthis.windowDrag = { drag: false };\n\t}\n\n\tfocus(appName) {\n\t\tthis.activeWindow.active = appName;\n\t}\n\n\taddWindow(id, el, ...props) {\n\t\tconst windowProps = { el };\n\t\tObject.defineProperty(windowProps, \"location_x\", {\n\t\t\tget() {\n\t\t\t\treturn windowProps._location_x;\n\t\t\t},\n\t\t\tset(val) {\n\t\t\t\twindowProps._location_x = val;\n\t\t\t\tel.style.left = val;\n\t\t\t},\n\t\t});\n\t\tObject.defineProperty(windowProps, \"location_y\", {\n\t\t\tget() {\n\t\t\t\treturn windowProps._location_y;\n\t\t\t},\n\t\t\tset(val) {\n\t\t\t\twindowProps._location_y = val;\n\t\t\t\tel.style.top = val;\n\t\t\t},\n\t\t});\n\n\t\tfor (let i = 0; i < props.length; i += 2) {\n\t\t\twindowProps[\"_\" + props[i]] = props[i + 1];\n\t\t}\n\t\tthis.windows[id] = windowProps;\n\t}\n\tremoveWindow(id) {\n\t\tif (this.windows[id]) {\n\t\t\tdelete this.windows[id];\n\t\t}\n\t}\n\tmodifyWindow(id, prop, value) {\n\t\tif (this.windows[id]) {\n\t\t\tthis.windows[id][prop] = value;\n\t\t}\n\t}\n\tgetZIndex(id) {\n\t\tif (this.windows[id]) {\n\t\t\treturn this.windows[id].zIndex;\n\t\t}\n\t}\n\n\tgetLocation(id) {\n\t\tif (this.windows[id]) {\n\t\t\tconst locationX = this.windows[id].location_x;\n\t\t\tconst locationY = this.windows[id].location_y;\n\t\t\tconst locationConcat = `X: ${locationX.replace(\n\t\t\t\t\"px\",\n\t\t\t\t\"\"\n\t\t\t)} , Y: ${locationY.replace(\"px\", \"\")}`;\n\t\t\treturn locationConcat;\n\t\t}\n\t}\n\n\tgetElement(id) {\n\t\treturn this.windows[id].el;\n\t}\n};\n\n// window.__XEN_WEBPACK.app = class AppManager {\n// \tconstructor() {\n\n//   }\n// \ttest(){\n//     console.log('hi')\n//   }\n// };\n\nwindow.__XEN_WEBPACK.core.NotificationComponent = class NotificationComponent {\n\tconstructor() {\n\t\tthis.notifications = {};\n\t}\n\n\tdispatch(name, description, icon) {\n\t\tconst check = document.getElementById(name);\n\n\t\tif (check == null || check == undefined || check == \"undefined\") {\n\t\t\tconst master = document.getElementById(\"os-desktop\");\n\t\t\tconst notiWrap = document.createElement(\"div\");\n\t\t\tconst iconWrap = document.createElement(\"div\");\n\t\t\tconst notiTitle = document.createElement(\"div\");\n\t\t\tconst notiDescription = document.createElement(\"div\");\n\t\t\tmaster.appendChild(notiWrap);\n\t\t\tnotiWrap.classList.add(\"os-notification-1\");\n\t\t\tnotiWrap.id = name;\n\t\t\tnotiWrap.setAttribute(\"ondblclick\", `this.style.display='none'`);\n\t\t\tnotiWrap.appendChild(iconWrap);\n\t\t\ticonWrap.classList.add(\"os-notification-icon\");\n\t\t\ticonWrap.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"447\" height=\"112\" viewBox=\"0 0 447 112\" fill=\"none\">\n<rect x=\"243.5\" y=\"39.5\" width=\"18\" height=\"34\" rx=\"6.5\" stroke=\"#F0F0F0\" stroke-width=\"5\"></rect>\n<rect x=\"4\" y=\"4\" width=\"239\" height=\"104\" rx=\"26\" stroke=\"white\" stroke-width=\"8\"></rect>\n<rect x=\"15\" y=\"17\" rx=\"16\" fill=\"white\" style=\"width: 50px; fill: rgb(255, 255, 255);\"></rect>\n</svg>`;\n\n\t\t\tnotiWrap.appendChild(notiTitle);\n\t\t\tnotiTitle.innerText = name;\n\t\t\tnotiTitle.classList.add(\"os-notification-title\");\n\n\t\t\tnotiWrap.appendChild(notiDescription);\n\t\t\tnotiDescription.innerText = description;\n\t\t\tnotiDescription.classList.add(\"os-notification-description\");\n\t\t} else if (\n\t\t\tcheck !== null ||\n\t\t\tcheck !== undefined ||\n\t\t\tcheck !== \"undefined\"\n\t\t) {\n\t\t\tthrow new TypeError(\n\t\t\t\t\"Error while Dispatching: \\n A notification with that name already exists.\"\n\t\t\t);\n\t\t}\n\t}\n\tretract(name) {\n\t\tlet el = document.getElementById(name);\n\t\tel.style.display = \"none\";\n\t}\n};\n\n// OS MotherBoard API\nwindow.__XEN_WEBPACK.core.OS = class OS {\n\tconstructor() {\n\t\tthis.fs = new window.__XEN_WEBPACK.core.VFS();\n\t\tthis.windowManager = new window.__XEN_WEBPACK.WindowManager();\n\t\tthis.system = new window.__XEN_WEBPACK.core.System();\n\t\tthis.browserTool = new window.__XEN_WEBPACK.core.browser();\n\t\tthis.notification =\n\t\t\tnew window.__XEN_WEBPACK.core.NotificationComponent();\n\t\tthis.appManager = new window.__XEN_WEBPACK.core.AppManagerComponent();\n\t\t// this.appManager = new window.__XEN_WEBPACK.app();\n\t}\n};\n\nObject.defineProperty(window, \"xen\", {\n\tconfigurable: false,\n\tvalue: new window.__XEN_WEBPACK.core.OS(),\n});\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/core.js?");

/***/ }),

/***/ "./public/rsc/js/draggable.js":
/*!************************************!*\
  !*** ./public/rsc/js/draggable.js ***!
  \************************************/
/***/ (() => {

eval("const headerBar = document.getElementById(\"os-header\");\nlet rect = headerBar.getBoundingClientRect();\n\ndocument.addEventListener(\"mousemove\", function (e) {\n\tconst dragBoxes = document.querySelectorAll(\".box-header-title\");\n\tdragBoxes.forEach(function (dBox) {\n\t\tdBox.addEventListener(\"mousedown\", function (e) {\n\t\t\tif (\n\t\t\t\te.clientX < rect.left ||\n\t\t\t\te.clientX > rect.right ||\n\t\t\t\te.clientY < rect.top ||\n\t\t\t\te.clientY > rect.bottom\n\t\t\t) {\n\t\t\t} else {\n\t\t\t\tconst activeWindowName = xen.windowManager.activeWindow.active;\n\t\t\t\tif (activeWindowName == \"null\") {\n\t\t\t\t\tconsole.log(\"No Active Window Selected\");\n\t\t\t\t} else {\n\t\t\t\t\ttry {\n\t\t\t\t\t\tconst activeWindow =\n\t\t\t\t\t\t\tdocument.getElementById(activeWindowName);\n\t\t\t\t\t\tactiveWindow.style.top = \"29px\";\n\t\t\t\t\t\te.preventDefault();\n\t\t\t\t\t\te.stopPropagation();\n\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\tconsole.log(e);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t});\n});\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/draggable.js?");

/***/ }),

/***/ "./public/rsc/js/index.js":
/*!********************************!*\
  !*** ./public/rsc/js/index.js ***!
  \********************************/
/***/ (() => {

eval("function getCurrentTime() {\n\tconst date = new Date();\n\tconst options = {\n\t\ttimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,\n\t\thour: \"numeric\",\n\t\tminute: \"numeric\",\n\t\thour12: true,\n\t};\n\treturn date.toLocaleString(\"en-US\", options);\n}\ndocument.addEventListener(\"DOMContentLoaded\", function () {\n\tconst timeText = document.getElementById(\"timeIndicator\");\n\tfunction updateTime() {\n\t\ttimeText.innerText = getCurrentTime();\n\t}\n\n\tsetInterval(updateTime, 1000);\n\t// XEN INIT\n\txen.system.begin();\n\n\t// Okay, so the Event is now renamed to WindowRegistration, and the event caries the object windowName, (so you'd do `event.windowName`)\n\n\tfunction initWindow(_win) {\n\t\tconst win = document.getElementById(_win);\n\t\tconst iframes = document.querySelectorAll(\"iframe\");\n\t\tconsole.log(iframes);\n\t\tconst navbar = win.querySelector(\".box-header-title\");\n\t\tlet startX,\n\t\t\tstartY,\n\t\t\tpreviousX,\n\t\t\tpreviousY = 0;\n\n\t\tnavbar.addEventListener(\"dblclick\", event => {\n\t\t\tconst styles = `width: 99.9%; height: 80%; top: 29px; position: absolute; left: 3px;`;\n\t\t\tconsole.log(win.style);\n\t\t\tif (xen.windowManager.maximizedWindow.name == _win) {\n\t\t\t\txen.windowManager.maximizedWindow.name == _win;\n\t\t\t\twin.style = `width: 613px;height: 518px;z-index: 10;top: 86px;position: absolute;left: 305px;`;\n\t\t\t} else {\n\t\t\t\txen.windowManager.maximizedWindow.name == null;\n\t\t\t\tlocalStorage.setItem(\"maximized-window\", true);\n\t\t\t\twin.style = styles;\n\t\t\t}\n\t\t});\n\t\tnavbar.addEventListener(\"mousedown\", e => {\n\t\t\tiframes.forEach(function (iframe) {\n\t\t\t\tiframe.style.pointerEvents = \"none\";\n\t\t\t});\n\n\t\t\tstartX = e.clientX - win.offsetLeft;\n\t\t\tstartY = e.clientY - win.offsetTop;\n\n\t\t\tdocument.addEventListener(\"mousemove\", handleMove, true);\n\t\t\tdocument.addEventListener(\"mouseup\", () => {\n\t\t\t\tdocument.removeEventListener(\"mouseup\", this);\n\t\t\t\tdocument.removeEventListener(\"mousemove\", handleMove, true);\n\t\t\t});\n\t\t});\n\n\t\tnavbar.addEventListener(\"mouseup\", e => {\n\t\t\tiframes.forEach(function (iframe) {\n\t\t\t\tiframe.style.pointerEvents = \"auto\";\n\t\t\t});\n\t\t});\n\n\t\tconst handleMove = e => {\n\t\t\tlet elmTop = win.style.top.split(\"px\")[0];\n\t\t\tlet elmLeft = win.style.left.split(\"px\")[0];\n\t\t\tlet boundsTop = elmTop < 30;\n\t\t\tlet boundsLeft =\n\t\t\t\telmLeft < 0 || elmLeft > screen.width - win.offsetWidth;\n\n\t\t\tlet left = e.clientX - startX;\n\t\t\tlet top = e.clientY - startY;\n\n\t\t\trequestAnimationFrame(() => {\n\t\t\t\twin.style.position = `absolute`;\n\n\t\t\t\twin.style.top = top + \"px\";\n\t\t\t\twin.style.left = left + \"px\";\n\t\t\t});\n\t\t};\n\t}\n\n\tconst os_desk = document.getElementById(\"os-desktop\");\n\tos_desk.addEventListener(\"NewWindow\", e => {\n\t\tconsole.log(e.detail.text);\n\t\tinitWindow(e.detail.text);\n\t});\n\n\tinitWindow(\"defaultWindow\");\n});\n\nconst btn = document.getElementById(\"launchpadButton\");\nconst lp = document.getElementById(\"launchpad-overlay\");\n\nconsole.log(btn);\n\n// btn.addEventListener(\"click\", function (e) {\n//   console.log('click')\n//   if (lp.style.display == 'flex') {\n//       xen.system.launchpad(false)\n//   } else {\n//       xen.system.launchpad(true)\n//   }\n\n// });\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/index.js?");

/***/ }),

/***/ "./public/rsc/js/preload.js":
/*!**********************************!*\
  !*** ./public/rsc/js/preload.js ***!
  \**********************************/
/***/ (() => {

eval("const os_preloader = document.getElementById(\"os-pre\");\nconst desk_defaultWindow = document.getElementById(\"defaultWindow\");\nconst os_preloader_txt = document.getElementById(\"os-pre-text\");\nconst os_desk = document.getElementById(\"os-desktop\");\nfunction errorHandler(event) {\n\tevent.preventDefault();\n\tconsole.log(event);\n\tconst style = `color:white;font-weight:bold;background-color:red;font-size:20px;`;\n\tconsole.error(\n\t\t\"Catastrophic error while initializing \\n\" +\n\t\t\tevent.stack +\n\t\t\t\"%c \\n CATASTROPHIC ERROR.. XENOS WILL NOT FUNCTION!\",\n\t\tstyle\n\t);\n\tos_preloader.style.color = \"red\";\n\tos_preloader_txt.innerText = \"Catastrophic Error!\";\n}\n//window.addEventListener(\"error\", errorHandler);\n\nsetTimeout(() => {\n\twindow.removeEventListener(\"error\", errorHandler);\n}, 5000);\n\nwindow.__XEN_WEBPACK.html.os_preloader = os_preloader;\nwindow.__XEN_WEBPACK.html.desk_defaultWindow = desk_defaultWindow;\nwindow.__XEN_WEBPACK.html.os_desk = os_desk;\n\nif (\"serviceWorker\" in navigator) {\n\tnavigator.serviceWorker\n\t\t.register(\"../../sw.js\")\n\t\t.then(function (registration) {\n\t\t\tconsole.log(\"Service worker registered successfully\");\n\t\t})\n\t\t.catch(function (error) {\n\t\t\tconsole.log(\"Service worker registration failed: \" + error);\n\t\t});\n}\n\nnavigator.serviceWorker.addEventListener(\"message\", function (event) {\n\tconsole.log(event.data.log);\n});\n\nsetTimeout(() => {\n\tos_preloader.style.opacity = 0;\n\tos_desk.style.transition = \"all .5s ease 0s;\";\n}, 3000);\n\nsetTimeout(() => {\n\tos_preloader.style.display = \"none\";\n}, 4000);\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/preload.js?");

/***/ }),

/***/ "./public/rsc/js/setup.js":
/*!********************************!*\
  !*** ./public/rsc/js/setup.js ***!
  \********************************/
/***/ (() => {

eval("const setupText = document.getElementById(\"SetupText\");\nconst Wrap = document.getElementById(\"SetupWrapper\");\nconst pwButtonWrap = document.getElementById(\"passWordButtonChoice\");\nconst pwInput = document.getElementById(\"passWordInput\");\nconst yesButton = document.getElementById(\"yesButton\");\nconst noButton = document.getElementById(\"noButton\");\nconst keyBindMenu = document.getElementById(\"keybinds\");\nconst finalButton = document.getElementById(\"doneButtonFinal\");\nconst setupStatus = localStorage.getItem(\"setup_status\");\nfunction set(a, b) {\n\tlocalStorage.getItem(a, b);\n}\nfunction step1() {\n\tsetupText.innerHTML = \"Please wait while we initialize your profile\";\n\tset(\"profile_name\", \"Profile1\");\n\tset(\"active_profile\", \"Profile1\");\n\tset(\"profile_password\", \"_*_xenos_*_nopassword_*_\");\n}\nfunction step2() {\n\tsetupText.innerHTML =\n\t\t\"Thanks for waiting. Would you like to choose a password?\";\n\tsetupText.style.animation = \"none\";\n\tpwButtonWrap.style.display = \"block\";\n}\nfunction pwOption(status) {\n\tif (status === \"yes\") {\n\t\tnoButton.style.display = \"none\";\n\t\tyesButton.style.display = \"none\";\n\t\tpwInput.style.display = \"block\";\n\t\t// submitButton.style.display = 'block'\n\t} else {\n\t\tnoButton.style.display = \"none\";\n\t\tyesButton.style.display = \"none\";\n\t}\n}\nfunction step3() {\n\tsetupText.innerHTML = \"Great!\";\n\tsetupText.style = \"\";\n}\nasync function step4() {\n\tsetupText.innerHTML = \"Let's introduce you to some important keybinds!\";\n\tsetupText.style.animation = \"none\";\n\tsetTimeout(() => {\n\t\tkeyBindMenu.style = `display: flex;animation: 0s ease 0s 1 normal none running none;align-items: center;justify-content: center; align-content: center; flex-wrap: nowrap;flex-direction: column;`;\n\t}, 1000);\n\tfinalButton.onclick = function () {\n\t\tkeyBindMenu.style = \"\";\n\t\tfinalButton.style.display = \"none\";\n\t\tsetupText.innerHTML = \"Perfect. Welcome to XenOS!\";\n\t\tsetTimeout(() => {\n\t\t\tWrap.style.opacity = \"0\";\n\t\t}, 1000);\n\t\tsetTimeout(() => {\n\t\t\tWrap.style.display = \"none\";\n\t\t\tlocalStorage.setItem(\"setup_status\", \"done\");\n\t\t}, 1000);\n\t};\n}\n\nif (setupStatus == null) {\n\tWrap.style = \"\";\n\t// needs to setup lol\n\tsetTimeout(() => {\n\t\tstep1();\n\t}, 6700);\n\tsetTimeout(() => {\n\t\tstep2();\n\t\tyesButton.onclick = function () {\n\t\t\tpwOption(\"yes\");\n\t\t};\n\t\tnoButton.onclick = function () {\n\t\t\tpwOption(\"no\");\n\t\t\tstep3();\n\t\t\tsetTimeout(() => {\n\t\t\t\tstep4();\n\t\t\t}, 4900);\n\t\t};\n\t}, 15500);\n} else if (setupStatus == \"done\") {\n\tconsole.log(\"already setup\");\n} else {\n\tconsole.log(\"idk\");\n}\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/setup.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./public/rsc/js/entry.ts");
/******/ 	
/******/ })()
;