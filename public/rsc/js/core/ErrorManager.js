window.__XEN_WEBPACK.core.ErrorComponent = class ErrorComponent {
  callback(error) {
  
    
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
