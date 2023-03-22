window.__XEN_WEBPACK.core.TerminalEngineComponent = class terminalComponent {
  
  constructor(){
    this.int = null;
    this.log = "";
    
  }
  
  createInstance(){
    
  }
  FESM(){
   // Override all console functions to throw an error message
['console.log', 'console.warn', 'console.error', 'console.info', 'console.debug', 'console.table', 'console.trace','xen.wait'].forEach(function(func) {
  [func] = function() {
    throw new Error('function ' + func + ' is not allowed in this mode!');
  }
});
 
};
  
  SFC(){
   // incomplete 
    console.clear()
    console.log('System File Check')
    setTimeout(function(){
      console.log('ComponentCheck')
    }, 1000)
    console.log(xen)
    console.log(xen.fs)
    console.log(xen.browserTool)
    console.log(xen.dock)
    console.log(xen.system)
    console.log(xen.notification)
    console.log(xen.wait)
    console.log(xen.windowManager)
    console.log(xen.logger)  
    console.log('passed component check')
   setTimeout(function(){
      console.log('objective function test')
    }, 1000)
   console.log(xen.blob64)
   console.log(xen.awaitAll)
    console.log('passed objective function test')
  }
  
}