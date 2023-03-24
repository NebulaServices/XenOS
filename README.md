![XOS LOGO](https://media.discordapp.net/attachments/1062938122666639360/1069977981352677446/XOS.png?width=400&height=400)

Highly sophisticated WebOS technology.

## Features

-   Easy to use
-   Many apps
-   Developer friendly
-   Closest thing to a Distro OS on the web

# XenOS API

### Warning!

These API's are NOT accessible from or for applications

## WindowManager API

The windowManager API mostly caries information about windows for the system to use.

```javascript
xen.windowManager.windows[windowName].prop; // returns a specific property of a window

// or
xen.windowManager.windows.windowName; // returns a property list specific to a window
// a specific prop
xen.windowManager.windows[windowName].prop; // returns the prop (json)
```

You can also get the active window with the windowManager api

```js
// Active dragging
xen.windowManager.windowDrag; // Returns true or false

// the most recently maximized window (yes there is an event listener/emitter)
xen.windowManager.maximizedWindow; // returns the window name

// More importantly, you can get the active window
xen.windowManager.activeWindow; // returns active window name
```

## System API

While the windowManager API is mostly systematic and informational only, The system API is responsible for most things that you can see. The system API completely relies on the windowManager, especially the register and unregister functions.

```js
// registering an app (make it show up on screen) and add it to the windowManager (automatic)
xen.system.register(
	"Window name (Identifier)",
	"Position Xaxis",
	"Position YAxis",
	"URL to the app (should be a directory on the Xen FileSystem)"
); // Returns the DOM html object

// You can also unregister items from the system and delete it from the windowManager
xen.system.unregister("app name"); // returns true or false.
```

Getting battery life is also a System API function

```js
xen.system.battery(); // will return an a % : such as '30%'
```

## FileSystem
Warning!
> Incomplete


# App SDK

## Creating an App

Create a Folder within ``/packages`` in ``_xenAppRepository``, the name should be the publisher/author of the app.
Then, place all of your relevant app files in the folder, ensure that there is a file named ``manifest.json``, ``icon.png``, and another JS file that will act as your ``entry`` file.

### Manifest.json
```js
{
  "name": "App Name",
  "assets": ["manifest.json", "app.js", "icon.png"], // All Relavent Assets
  "entry": "app.js", // Your entry file
  "type": "app",
  "repository": "none",
  "permissions": ["apps"], // This can be a blank array as well
  "icon": "./icon.png", // App Icon
  "version": "1.0" // Changing this version will signal the app needs an upgrade to the OS.
}
```
Example:

```js
// Example app manifest
{
  "name": "Bnkr-Pro",
  "assets": ["manifest.json", "index.html", "app.js", "icon.png"],
  "entry": "app.js",
  "type": "app",
  "repository": "none",
  "permissions": ["apps"],
  "icon": "icon.png",
  "version": "0.2"
}
```
Tip:
> If you do not include your assets in the ``"assets"`` property they will not load!

### Entry File

Typically an entry file will be named ``app.js``. This file will deal with most things your app does that interact with XOS.

A typical entry file will include the following
```js
const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1200,
  height: 600,
  show: true,
  alwaysOnTop: false,
  frame: true,
  dragableClass: "dragable"
});

win.loadFile('/index.html');
```
You can customize the dimensions of the window or other properties as you'd like.

### Requesting Permissions

```js
win.on('openNewWindow', function(name, loc) { // 'openNewWindow' is the name you'd like to call this function with in your app.
  win.openNewWindow(name, loc) // The XOS Permission you are requesting along with relevant data passed in.
})
```
In your entry file, listen for something with ``win.on`` and then specify the name of what you are listening for.
## OpenNewWindow
```js
win.openNewWindow(name, location)
```
To open a new window, pass in the ``name`` of the window, as well as the ``location`` of the page that will be put in the window.

Example Usage in App:
```js
albumArt.onclick = () => {
     let baseUrl = location.href.replace(/\/index\.html$/, "");
     let url = baseUrl + "/albuminfo.html?album=" + album;
     const { parent } = xen; // Defines Parent as being Xen
     parent.send("openNewWindow", "MLib Album View", url); // Defines Title as "MLib Album View", and the url as the variable "url"
};
```
In this example, the app sends a request to the Entry File to open a new window. The entry file will take this request and properly send it to XOS which will then open a new window as long as the required arguments are supplied.

## Custom Backdrop
```js
win.requestModifySetting('customBackdrop', data);
```
To set a custom backdrop, simply pass in a ``blob URL`` with the desired image.

Example Usage in App:
```js
function setXenBg() {
  const { parent } = xen; // Defines Xen
  let currentBg = localStorage.getItem("songArt"); // Gets image, currently in data: form
  let bgSet = dataURItoBlob(currentBg); // Passes it into another function internally to convert it to a blob
  let url = URL.createObjectURL(bgSet); // Turns it into a usable URL
  parent.send("customBg", url); // Sends the data to a function in entry file called "customBg"
}
```
This sends the blobURL to a function within the entry file which will then call ``win.requestModifySetting('customBackdrop', data);`` and will pass in the blob.

## Notification API

Sending notifications

```js
xen.notification.dispatch(
	"Notification Name",
	"Description (notification body)",
	"icon",
	callbackFunction
);

// Example:
xen.notification.dispatch(
	"Youtube",
	"Your favorite youtuber made a post!",
	"https://youtube.com/svg/icon.png",
	function (a) {
		console.log(a.status); // Returns "ALIVE"
	}
);
```

Retracting/deleting notifications

```js
retract("Notification Name!");
```
