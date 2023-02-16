const path = require('path-browserify');

window.__XEN_WEBPACK.core.DockComponent = class DockComponent {
  pins = [];
  
  constructor(fs) {
    this.fs = fs;
    this.split = document.querySelector('.os-dock-resize');
    this.cont = document.querySelector('.os-dock');
  }

  async #add(app, pin = false) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    var icon = path.join('/apps/'+app, meta.icon);

    var el = document.createElement('div');
    el.classList.add('os-dock-item');
    el.id = '_Dock_'+meta.name;

    var tt = document.createElement('div');
    tt.classList.add('os-dock-tooltip');
    tt.setAttribute('style', 'display:none;');

    var tti = document.createElement('div');
    tti.classList.add('os-dock-tooltip-inner');

    var ul = document.createElement('ul');
    var li = document.createElement('li');
    li.innerText = ' No options ';
    ul.appendChild(li);

    tti.appendChild(ul);
    tt.appendChild(tti);

    var img = document.createElement('img');
    img.src = icon;
    img.setAttribute('onclick', `window.xen.apps.launch("${app}")`);

    var indic = document.createElement('div');
    indic.classList.add('os-dock-item-indic');

    el.appendChild(tt);
    el.appendChild(img);
    el.appendChild(indic);

    if (pin) this.cont.insertBefore(el, this.split); else this.cont.insertAfter(el, this.split);

    return true;
  }

  async opened(app) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    if (this.pins.includes(app)) {
      document.querySelector('#_Dock_'+meta.name).querySelector('.os-dock-item-indic').style.opacity = '1';
      document.querySelector('#_Dock_'+meta.name).setAttribute('onclick', '');
    } else {
      await this.#add(app);
  
      document.querySelector('#_Dock_'+meta.name).querySelector('.os-dock-item-indic').style.opacity = '1';
    }

    
  }

  async pin(app) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    var data = await this.fs.readFile('__DOCK_PINS.xen', true);

    data.push(app);

    if (document.getElementById('_Dock_'+meta.name)) {
      console.log(document.getElementById('_Dock_'+meta.name));
    }
    
    await this.fs.writeFile('__DOCK_PINS.xen', JSON.stringify(data));
  }

  async loadPins() {
    var that = this;
    
    var data = await this.fs.readFile('__DOCK_PINS.xen', true);

    data.forEach(app => {
      that.pins.push(app);
      that.#add(app, true);
    });
  }
  
  async loadNative() {
    var fs = this.fs;
    var that = this;

    if (!await this.fs.exists('__DOCK_PINS.xen')) await this.fs.writeFile('__DOCK_PINS.xen', JSON.stringify(['Xen/Store', 'Xen/notes', 'Xen/Testflight', 'Velocity/Velocity']));

    await this.loadPins();
  }

  async show(app) {
    
  }

  async hide(app, open = false) {
    
  }
}
