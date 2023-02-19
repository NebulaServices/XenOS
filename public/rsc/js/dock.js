const path = require('path-browserify');

window.__XEN_WEBPACK.core.DockComponent = class DockComponent {
  pins = [];
  itemOpen = null;
  
  constructor(fs) {
    this.fs = fs;
    this.split = document.querySelector('.os-dock-resize');
    this.cont = document.querySelector('.os-dock');
  }

  async #remove(app) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();

    document.getElementById('_Dock_'+meta.name).remove();
    return true;
  }

  async #add(app, pin = false) {
    var that = this;
    
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    var icon = path.join('/apps/'+app, meta.icon||'unknown');

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

    img.onerror = function() {
      img.src = 'https://google.com/favicon.ico';
    }

    var indic = document.createElement('div');
    indic.classList.add('os-dock-item-indic');

    var nativeTooltip = [
      ["Quit", (e)=>console.log(e)],
    ]

    if (nativeTooltip.length>0) ul.innerHTML = '';

    nativeTooltip.forEach(e=>{
      ul.insertAdjacentHTML('beforeend', `<li onclick="${e[1].toString()}">${e[0]}</li>`)
    });

    el.addEventListener("contextmenu", function(event) {
        event.preventDefault();

        if (that.itemOpen) that.itemOpen.style.display = 'none';
      
        var dockItem = el.getElementsByClassName("os-dock-tooltip")[0];
        dockItem.style.display = "block";
      
        document.getElementById('dynamic-style').disabled = true;
        document.getElementById('dynamic-style2').disabled = false;

      
        that.itemOpen = dockItem;
      
        function func(event) {
          try {
             if (!dockItem.contains(event.target)) {
                dockItem.style.display = "none";
                dockItem = null;
                document.getElementById('dynamic-style').disabled = false;
                document.getElementById('dynamic-style2').disabled = true;
                document.removeEventListener('mousedown', func);
            }
          }
           catch (e){
             console.log(e)
           }
        }
      
        document.addEventListener("mousedown", func);
    });

    el.appendChild(tt);
    el.appendChild(img);
    el.appendChild(indic);

    if (pin) this.cont.insertBefore(el, this.split); else this.cont.insertAfter(el, this.split);

    return true;
  }

  async opened(app) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    if (this.pins.includes(app)) {
      document.getElementById('_Dock_'+meta.name).querySelector('.os-dock-item-indic').style.opacity = '1';
      document.getElementById('_Dock_'+meta.name).querySelector('img').setAttribute('onclick', '');
    } else {
      await this.#add(app);

      document.getElementById('_Dock_'+meta.name).querySelector('img').setAttribute('onclick', '');
      document.getElementById('_Dock_'+meta.name).querySelector('.os-dock-item-indic').style.opacity = '1';
    }

    
  }

  async quit(app) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    if (this.pins.includes(app)) {
      document.getElementById('_Dock_'+meta.name).querySelector('.os-dock-item-indic').style.opacity = '0';
      document.getElementById('_Dock_'+meta.name).querySelector('img').setAttribute('onclick', `window.xen.apps.launch("${app}")`);
    } else {
      await this.#remove(app);
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

    return true;
  }

  async loadPins() {
    var that = this;
    
    var data = await this.fs.readFile('__DOCK_PINS.xen', true);

    for (var app of data) {
      that.pins.push(app);
      await that.#add(app, true);
    };

    return true;
  }
  
  async loadNative() {
    var fs = this.fs;
    var that = this;

    if (!await this.fs.exists('__DOCK_PINS.xen')) await this.fs.writeFile('__DOCK_PINS.xen', JSON.stringify(['Xen/Store', 'Xen/notes', 'Xen/Testflight', 'Velocity/Velocity', 'Xen/Settings']));

    await this.loadPins();

    return true;
  }

  async icon(app, url) {
    const meta = await (await fetch('/apps/'+app+'/manifest.json')).json();
    
    if (document.getElementById('_Dock_'+meta.name)) {
      document.getElementById('_Dock_'+meta.name).querySelector('img').src = url;
    }
  }

  async show(app) {
    
  }

  async hide(app, open = false) {
    
  }
}
