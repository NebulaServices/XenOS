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

/***/ "./node_modules/path-browserify/index.js":
/*!***********************************************!*\
  !*** ./node_modules/path-browserify/index.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
eval("// 'path' module extracted from Node.js v8.11.1 (only the posix part)\n// transplited with Babel\n\n// Copyright Joyent, Inc. and other Node contributors.\n//\n// Permission is hereby granted, free of charge, to any person obtaining a\n// copy of this software and associated documentation files (the\n// \"Software\"), to deal in the Software without restriction, including\n// without limitation the rights to use, copy, modify, merge, publish,\n// distribute, sublicense, and/or sell copies of the Software, and to permit\n// persons to whom the Software is furnished to do so, subject to the\n// following conditions:\n//\n// The above copyright notice and this permission notice shall be included\n// in all copies or substantial portions of the Software.\n//\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\n// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\n// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\n// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\n// USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n\n\nfunction assertPath(path) {\n  if (typeof path !== 'string') {\n    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));\n  }\n}\n\n// Resolves . and .. elements in a path with directory names\nfunction normalizeStringPosix(path, allowAboveRoot) {\n  var res = '';\n  var lastSegmentLength = 0;\n  var lastSlash = -1;\n  var dots = 0;\n  var code;\n  for (var i = 0; i <= path.length; ++i) {\n    if (i < path.length)\n      code = path.charCodeAt(i);\n    else if (code === 47 /*/*/)\n      break;\n    else\n      code = 47 /*/*/;\n    if (code === 47 /*/*/) {\n      if (lastSlash === i - 1 || dots === 1) {\n        // NOOP\n      } else if (lastSlash !== i - 1 && dots === 2) {\n        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {\n          if (res.length > 2) {\n            var lastSlashIndex = res.lastIndexOf('/');\n            if (lastSlashIndex !== res.length - 1) {\n              if (lastSlashIndex === -1) {\n                res = '';\n                lastSegmentLength = 0;\n              } else {\n                res = res.slice(0, lastSlashIndex);\n                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');\n              }\n              lastSlash = i;\n              dots = 0;\n              continue;\n            }\n          } else if (res.length === 2 || res.length === 1) {\n            res = '';\n            lastSegmentLength = 0;\n            lastSlash = i;\n            dots = 0;\n            continue;\n          }\n        }\n        if (allowAboveRoot) {\n          if (res.length > 0)\n            res += '/..';\n          else\n            res = '..';\n          lastSegmentLength = 2;\n        }\n      } else {\n        if (res.length > 0)\n          res += '/' + path.slice(lastSlash + 1, i);\n        else\n          res = path.slice(lastSlash + 1, i);\n        lastSegmentLength = i - lastSlash - 1;\n      }\n      lastSlash = i;\n      dots = 0;\n    } else if (code === 46 /*.*/ && dots !== -1) {\n      ++dots;\n    } else {\n      dots = -1;\n    }\n  }\n  return res;\n}\n\nfunction _format(sep, pathObject) {\n  var dir = pathObject.dir || pathObject.root;\n  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');\n  if (!dir) {\n    return base;\n  }\n  if (dir === pathObject.root) {\n    return dir + base;\n  }\n  return dir + sep + base;\n}\n\nvar posix = {\n  // path.resolve([from ...], to)\n  resolve: function resolve() {\n    var resolvedPath = '';\n    var resolvedAbsolute = false;\n    var cwd;\n\n    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {\n      var path;\n      if (i >= 0)\n        path = arguments[i];\n      else {\n        if (cwd === undefined)\n          cwd = process.cwd();\n        path = cwd;\n      }\n\n      assertPath(path);\n\n      // Skip empty entries\n      if (path.length === 0) {\n        continue;\n      }\n\n      resolvedPath = path + '/' + resolvedPath;\n      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;\n    }\n\n    // At this point the path should be resolved to a full absolute path, but\n    // handle relative paths to be safe (might happen when process.cwd() fails)\n\n    // Normalize the path\n    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);\n\n    if (resolvedAbsolute) {\n      if (resolvedPath.length > 0)\n        return '/' + resolvedPath;\n      else\n        return '/';\n    } else if (resolvedPath.length > 0) {\n      return resolvedPath;\n    } else {\n      return '.';\n    }\n  },\n\n  normalize: function normalize(path) {\n    assertPath(path);\n\n    if (path.length === 0) return '.';\n\n    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;\n    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;\n\n    // Normalize the path\n    path = normalizeStringPosix(path, !isAbsolute);\n\n    if (path.length === 0 && !isAbsolute) path = '.';\n    if (path.length > 0 && trailingSeparator) path += '/';\n\n    if (isAbsolute) return '/' + path;\n    return path;\n  },\n\n  isAbsolute: function isAbsolute(path) {\n    assertPath(path);\n    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;\n  },\n\n  join: function join() {\n    if (arguments.length === 0)\n      return '.';\n    var joined;\n    for (var i = 0; i < arguments.length; ++i) {\n      var arg = arguments[i];\n      assertPath(arg);\n      if (arg.length > 0) {\n        if (joined === undefined)\n          joined = arg;\n        else\n          joined += '/' + arg;\n      }\n    }\n    if (joined === undefined)\n      return '.';\n    return posix.normalize(joined);\n  },\n\n  relative: function relative(from, to) {\n    assertPath(from);\n    assertPath(to);\n\n    if (from === to) return '';\n\n    from = posix.resolve(from);\n    to = posix.resolve(to);\n\n    if (from === to) return '';\n\n    // Trim any leading backslashes\n    var fromStart = 1;\n    for (; fromStart < from.length; ++fromStart) {\n      if (from.charCodeAt(fromStart) !== 47 /*/*/)\n        break;\n    }\n    var fromEnd = from.length;\n    var fromLen = fromEnd - fromStart;\n\n    // Trim any leading backslashes\n    var toStart = 1;\n    for (; toStart < to.length; ++toStart) {\n      if (to.charCodeAt(toStart) !== 47 /*/*/)\n        break;\n    }\n    var toEnd = to.length;\n    var toLen = toEnd - toStart;\n\n    // Compare paths to find the longest common path from root\n    var length = fromLen < toLen ? fromLen : toLen;\n    var lastCommonSep = -1;\n    var i = 0;\n    for (; i <= length; ++i) {\n      if (i === length) {\n        if (toLen > length) {\n          if (to.charCodeAt(toStart + i) === 47 /*/*/) {\n            // We get here if `from` is the exact base path for `to`.\n            // For example: from='/foo/bar'; to='/foo/bar/baz'\n            return to.slice(toStart + i + 1);\n          } else if (i === 0) {\n            // We get here if `from` is the root\n            // For example: from='/'; to='/foo'\n            return to.slice(toStart + i);\n          }\n        } else if (fromLen > length) {\n          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {\n            // We get here if `to` is the exact base path for `from`.\n            // For example: from='/foo/bar/baz'; to='/foo/bar'\n            lastCommonSep = i;\n          } else if (i === 0) {\n            // We get here if `to` is the root.\n            // For example: from='/foo'; to='/'\n            lastCommonSep = 0;\n          }\n        }\n        break;\n      }\n      var fromCode = from.charCodeAt(fromStart + i);\n      var toCode = to.charCodeAt(toStart + i);\n      if (fromCode !== toCode)\n        break;\n      else if (fromCode === 47 /*/*/)\n        lastCommonSep = i;\n    }\n\n    var out = '';\n    // Generate the relative path based on the path difference between `to`\n    // and `from`\n    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {\n      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {\n        if (out.length === 0)\n          out += '..';\n        else\n          out += '/..';\n      }\n    }\n\n    // Lastly, append the rest of the destination (`to`) path that comes after\n    // the common path parts\n    if (out.length > 0)\n      return out + to.slice(toStart + lastCommonSep);\n    else {\n      toStart += lastCommonSep;\n      if (to.charCodeAt(toStart) === 47 /*/*/)\n        ++toStart;\n      return to.slice(toStart);\n    }\n  },\n\n  _makeLong: function _makeLong(path) {\n    return path;\n  },\n\n  dirname: function dirname(path) {\n    assertPath(path);\n    if (path.length === 0) return '.';\n    var code = path.charCodeAt(0);\n    var hasRoot = code === 47 /*/*/;\n    var end = -1;\n    var matchedSlash = true;\n    for (var i = path.length - 1; i >= 1; --i) {\n      code = path.charCodeAt(i);\n      if (code === 47 /*/*/) {\n          if (!matchedSlash) {\n            end = i;\n            break;\n          }\n        } else {\n        // We saw the first non-path separator\n        matchedSlash = false;\n      }\n    }\n\n    if (end === -1) return hasRoot ? '/' : '.';\n    if (hasRoot && end === 1) return '//';\n    return path.slice(0, end);\n  },\n\n  basename: function basename(path, ext) {\n    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('\"ext\" argument must be a string');\n    assertPath(path);\n\n    var start = 0;\n    var end = -1;\n    var matchedSlash = true;\n    var i;\n\n    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {\n      if (ext.length === path.length && ext === path) return '';\n      var extIdx = ext.length - 1;\n      var firstNonSlashEnd = -1;\n      for (i = path.length - 1; i >= 0; --i) {\n        var code = path.charCodeAt(i);\n        if (code === 47 /*/*/) {\n            // If we reached a path separator that was not part of a set of path\n            // separators at the end of the string, stop now\n            if (!matchedSlash) {\n              start = i + 1;\n              break;\n            }\n          } else {\n          if (firstNonSlashEnd === -1) {\n            // We saw the first non-path separator, remember this index in case\n            // we need it if the extension ends up not matching\n            matchedSlash = false;\n            firstNonSlashEnd = i + 1;\n          }\n          if (extIdx >= 0) {\n            // Try to match the explicit extension\n            if (code === ext.charCodeAt(extIdx)) {\n              if (--extIdx === -1) {\n                // We matched the extension, so mark this as the end of our path\n                // component\n                end = i;\n              }\n            } else {\n              // Extension does not match, so our result is the entire path\n              // component\n              extIdx = -1;\n              end = firstNonSlashEnd;\n            }\n          }\n        }\n      }\n\n      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;\n      return path.slice(start, end);\n    } else {\n      for (i = path.length - 1; i >= 0; --i) {\n        if (path.charCodeAt(i) === 47 /*/*/) {\n            // If we reached a path separator that was not part of a set of path\n            // separators at the end of the string, stop now\n            if (!matchedSlash) {\n              start = i + 1;\n              break;\n            }\n          } else if (end === -1) {\n          // We saw the first non-path separator, mark this as the end of our\n          // path component\n          matchedSlash = false;\n          end = i + 1;\n        }\n      }\n\n      if (end === -1) return '';\n      return path.slice(start, end);\n    }\n  },\n\n  extname: function extname(path) {\n    assertPath(path);\n    var startDot = -1;\n    var startPart = 0;\n    var end = -1;\n    var matchedSlash = true;\n    // Track the state of characters (if any) we see before our first dot and\n    // after any path separator we find\n    var preDotState = 0;\n    for (var i = path.length - 1; i >= 0; --i) {\n      var code = path.charCodeAt(i);\n      if (code === 47 /*/*/) {\n          // If we reached a path separator that was not part of a set of path\n          // separators at the end of the string, stop now\n          if (!matchedSlash) {\n            startPart = i + 1;\n            break;\n          }\n          continue;\n        }\n      if (end === -1) {\n        // We saw the first non-path separator, mark this as the end of our\n        // extension\n        matchedSlash = false;\n        end = i + 1;\n      }\n      if (code === 46 /*.*/) {\n          // If this is our first dot, mark it as the start of our extension\n          if (startDot === -1)\n            startDot = i;\n          else if (preDotState !== 1)\n            preDotState = 1;\n      } else if (startDot !== -1) {\n        // We saw a non-dot and non-path separator before our dot, so we should\n        // have a good chance at having a non-empty extension\n        preDotState = -1;\n      }\n    }\n\n    if (startDot === -1 || end === -1 ||\n        // We saw a non-dot character immediately before the dot\n        preDotState === 0 ||\n        // The (right-most) trimmed path component is exactly '..'\n        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {\n      return '';\n    }\n    return path.slice(startDot, end);\n  },\n\n  format: function format(pathObject) {\n    if (pathObject === null || typeof pathObject !== 'object') {\n      throw new TypeError('The \"pathObject\" argument must be of type Object. Received type ' + typeof pathObject);\n    }\n    return _format('/', pathObject);\n  },\n\n  parse: function parse(path) {\n    assertPath(path);\n\n    var ret = { root: '', dir: '', base: '', ext: '', name: '' };\n    if (path.length === 0) return ret;\n    var code = path.charCodeAt(0);\n    var isAbsolute = code === 47 /*/*/;\n    var start;\n    if (isAbsolute) {\n      ret.root = '/';\n      start = 1;\n    } else {\n      start = 0;\n    }\n    var startDot = -1;\n    var startPart = 0;\n    var end = -1;\n    var matchedSlash = true;\n    var i = path.length - 1;\n\n    // Track the state of characters (if any) we see before our first dot and\n    // after any path separator we find\n    var preDotState = 0;\n\n    // Get non-dir info\n    for (; i >= start; --i) {\n      code = path.charCodeAt(i);\n      if (code === 47 /*/*/) {\n          // If we reached a path separator that was not part of a set of path\n          // separators at the end of the string, stop now\n          if (!matchedSlash) {\n            startPart = i + 1;\n            break;\n          }\n          continue;\n        }\n      if (end === -1) {\n        // We saw the first non-path separator, mark this as the end of our\n        // extension\n        matchedSlash = false;\n        end = i + 1;\n      }\n      if (code === 46 /*.*/) {\n          // If this is our first dot, mark it as the start of our extension\n          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;\n        } else if (startDot !== -1) {\n        // We saw a non-dot and non-path separator before our dot, so we should\n        // have a good chance at having a non-empty extension\n        preDotState = -1;\n      }\n    }\n\n    if (startDot === -1 || end === -1 ||\n    // We saw a non-dot character immediately before the dot\n    preDotState === 0 ||\n    // The (right-most) trimmed path component is exactly '..'\n    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {\n      if (end !== -1) {\n        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);\n      }\n    } else {\n      if (startPart === 0 && isAbsolute) {\n        ret.name = path.slice(1, startDot);\n        ret.base = path.slice(1, end);\n      } else {\n        ret.name = path.slice(startPart, startDot);\n        ret.base = path.slice(startPart, end);\n      }\n      ret.ext = path.slice(startDot, end);\n    }\n\n    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';\n\n    return ret;\n  },\n\n  sep: '/',\n  delimiter: ':',\n  win32: null,\n  posix: null\n};\n\nposix.posix = posix;\n\nmodule.exports = posix;\n\n\n//# sourceURL=webpack://nodejs/./node_modules/path-browserify/index.js?");

/***/ }),

/***/ "./public/rsc/js/inject/index.js":
/*!***************************************!*\
  !*** ./public/rsc/js/inject/index.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("Object.defineProperty(window, \"xen\", {\n\tvalue: {},\n\tenumerable: false,\n});\n\nvar modules = {\n  path: __webpack_require__(/*! path-browserify */ \"./node_modules/path-browserify/index.js\"),\n}\n\nvar listeners = [];\n\nxen.parent = {\n\tsend(message, ...data) {\n\t\twindow.top.postMessage({ message, data: data });\n\t},\n\ton(event, cb) {\n\t\tlisteners.push([event, cb]);\n\t},\n};\n\nxen.modules = {};\n\nlisteners.push([\n\t\"__XEN_LISTENER_CONNECTION_MANAGER\",\n\tfunction (type, ...args) {\n    console.log(type);\n\t\tif (type == \"executeJS\") return window.eval(args[0]);\n\t},\n]);\n\nlisteners.push([\n  '__XEN_MODULE_CONNECTION',\n  function({ name }) {\n    console.log(name);\n    xen.modules[name] = modules[name];\n  }\n])\n\nwindow.addEventListener(\"message\", function (data) {\n  console.log(data);\n\tlisteners\n\t\t.filter(e => e[0] == data.data.message)\n\t\t.forEach(e => e[1](...data.data.data));\n});\n\n\n//# sourceURL=webpack://nodejs/./public/rsc/js/inject/index.js?");

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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
/******/ 	var __webpack_exports__ = __webpack_require__("./public/rsc/js/inject/index.js");
/******/ 	
/******/ })()
;