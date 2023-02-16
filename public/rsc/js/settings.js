window.__XEN_WEBPACK.core.SettingsComponent = class SystemSettings {
  background = {
    default: 'fruity-bg.png',
    forest: 'bg2.jpg',
  }
  constructor(){
   this.settings = {"_background":"default","colorMode":"light"}

    var that = this;

    Object.defineProperty(this.settings, 'background', {
      get() {
        return this._background;
      },
      set(val) {
        this._background = val;
        document.querySelector('.os-body').style.background = `url("/rsc/img/${that.background[val]||'default'}")`;
      }
    });

    this.settings.background = localStorage.getItem('xen-bg')||'default';
  }
  apply(){
    
  }
  set(setting, value){
    
  }
}
