window.__XEN_WEBPACK.core.ErrorComponent = class ErrorComponent {
  callback(error) {
   
const loadTitle = document.getElementById('os-pre-text')
const preloadScreen = document.getElementById('os-pre')
const loadDesc = document.getElementById('os-pre-text2')
var catter = document.getElementById('errorCatter')

   console.log(error) 

  loadTitle.innerText = 'XenOS ran into an error.'
  loadDesc.innerText = `Sorry, XenOS ran into an error that may cause Xen to not run as intended, or at all, because of a problem we encountered during startup. `
  catter.style = ''

  catter.innerText += ` \n 
  Error information: \n
  Type: Termination \n Unable to Init: True \n Error:\n${error}
  \n`

  loadDesc.style = 'animation:none; font-size:13px; color: white;    margin-top: -10px;'
  loadTitle.style = 'animation:none;color: white; '
  preloadScreen.style.background = '#171717'

    
    fetch('https://xen-analytics.enderkingj.repl.co/api/error', {
      method: 'POST',
      body: JSON.stringify({error: error, args: [...arguments]})
    });
  }
  
	constructor() {
    var that = this; // error logging !!!!!!!!
    
    /*window.onerror = that.callback;

    [...document.all].forEach(el => {
      el.onerror = that.callback;
    });

    window.onunhandledrejection = (e) => {
      e.preventDefault();

      e.returnValue = true;
      
      throw e.reason.stack;
    }*/
  }
};
