// INTERNAL USE
window.__XEN_WEBPACK.core.browser = class BrowserTool {
  constructor() {}
  fullscreen() {
    if (
      (document.fullScreenElement && document.fullScreenElement !== null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)
    ) {
      if (document.documentElement.requestFullScreen)
        document.documentElement.requestFullScreen();
      else if (document.documentElement.mozRequestFullScreen)
        document.documentElement.mozRequestFullScreen();
      else if (document.documentElement.webkitRequestFullScreen)
        document.documentElement.webkitRequestFullScreen(
          Element.ALLOW_KEYBOARD_INPUT
        );
    } else {
      if (document.cancelFullScreen) document.cancelFullScreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.webkitCancelFullScreen)
        document.webkitCancelFullScreen();
    }
  }
};
