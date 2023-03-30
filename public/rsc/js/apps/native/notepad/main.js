const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: true,
  dragableClass: "dragable"
});

win.loadFile('/index.html');
win.requestFileSystemPermission()



win.on('save', (NoteName, NoteContent) => {
  console.log(NoteName, NoteContent)
win.writeFile(NoteName, NoteContent)
  
});