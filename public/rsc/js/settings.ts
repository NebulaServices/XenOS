// @ts-nocheck

window.__XEN_WEBPACK.core.SettingsComponent = class SystemSettings {
  constructor() {
    this.settings = { _background: "default", colorMode: "light" };
    this.background = {
      default: "fruity-bg.png",
      forest: "bg2.jpg",
    };

    this._data = {}

    // for now

    
  }

  async init() {
    /*
    
for (const key in xen.settings.background) {
 var img = new Image();
img.src = "./rsc/img/"+xen.settings.background[key];
  console.log(img.src)
  
}
*/
    for (let name in this.background) {
      var bg = this.background[name];
      var req = await fetch('/rsc/img/'+bg);

      var blob = await req.blob();

      this._data[bg] = URL.createObjectURL(blob, {type: req.headers['content-type']})
    }
    
    this.setBg(this.background[localStorage.getItem('xen-bg') || 'default']);
  }
    
  async setBg(name: string) {
    if (Object.entries(this.background).find(e => e[1] == name)) localStorage.setItem('xen-bg', Object.entries(this.background).find(e => e[1] == name)[0]);

    if (!name) {
      name = localStorage.getItem('xen-bg');
      if (name.startsWith('blob:')) {
        name = await xen.fs.readFile(name);
      } else {
        if (Object.entries(this.background).find(e => e[1] == name)) localStorage.setItem('xen-bg', Object.entries(this.background).find(e => e[1] == name)[0]);
      }
    }

    if (name.startsWith('blob:')) {
      var n = await xen.blob64(name);
      await xen.fs.writeFile(name, n);

      name = n;
    }
    
    if (!name) return console.log('Background Error: 1002');

    if (name.startsWith('blob:')||name.startsWith('data:')) return document.querySelector(
      ".os-body"
    ).style.backgroundImage = `url("${name}")`;
    
    document.querySelector(
      ".os-body"
    ).style.backgroundImage = `url("${this._data[name]}")`;
  }

  setCustomBg(setting: string) {
    if (setting.startsWith('blob:')) {
      localStorage.setItem('xen-bg', setting);
      
      document.querySelector(
        ".os-body"
      ).style.backgroundImage = `url("${setting}")`;
    }
  }
};
