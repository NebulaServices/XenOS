window.__XEN_WEBPACK.core.SettingsComponent = class SystemSettings {
  constructor(){
   this.settings = {"_background":"default","colorMode":"light"}
  this.background = {
    default: 'fruity-bg.png',
    forest: 'bg2.jpg',
  }
    }
  setBg(name){
    document.querySelector('.os-body').style.background = `url("https://xenos-dev.greenworldia.repl.co/rsc/img/${name}}")`
  }
}
