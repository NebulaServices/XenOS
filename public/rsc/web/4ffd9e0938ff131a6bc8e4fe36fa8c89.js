const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 100,
  show: true,
  alwaysOnTop: true,
});

win.loadFile('/index.html');

win.on('message', function(message) {
  console.log(message)
});