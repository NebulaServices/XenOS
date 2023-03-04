window.__XEN_WEBPACK.core.ErrorComponent = class ErrorComponent {
	constructor() {
    window.onerror = function() {
      console.log(arguments);
    }
  }
};
