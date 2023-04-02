const { BrowserWindow } = xen;

const FEATURED_APP = "cohenerickson/Velocity";

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: false,
  modules: ['path'],
});

await win.loadFile("static/index.html");

const apps = win.RequestGetAllApps();

const featured_app = (await (await fetch('https://xenos-app-repository.enderkingj.repl.co')).json()).find(e=>e.id==FEATURED_APP);

win.send("setApps", apps);
win.send("setFeaturedApp", featured_app);

win.on("install", (appId) => {
  xen.apps.install(appId).then(() => {
    win.send("installSuccess", appId);
  }).catch(() => {
    win.send("installFail", appId);
  });
});

win.on("uninstall", (appId) => {
  xen.apps.uninstall(appId).then(() => {
    win.send("uninstallSuccess", appId);
  }).catch((e) => {
    console.log(e)
    win.send("uninstallFail", appId);
  });
});

win.on('getApps', () => {
  win.send('setApps', win.RequestGetAllApps());
});