const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: true,
  dragableClass: "dragable"
});

win.loadFile('/main.html');
console.log('Main Loaded')

 // lets see if this still works
win.on('backdrop', function(data) {
    win.requestModifySetting('backdrop', data);
});
// okay