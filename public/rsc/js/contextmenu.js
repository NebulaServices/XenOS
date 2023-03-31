window.__XEN_WEBPACK.core.ContextMenu = class ContextMenu {
  constructor() {
    this.menu = null;
  }

  assign(elementId, options) {
    const element = document.getElementById(elementId);
    element.addEventListener('contextmenu', event => {
      event.preventDefault();
      
      if (this.menu) {
        this.menu.remove();
      }
      
      const menu = document.createElement('div');
      menu.className = 'context-menu';
      this.menu = menu;
      
      for (const [title, action] of Object.entries(options)) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerText = title;
        item.addEventListener('click', () => {
          action();
          menu.remove();
        });
        menu.appendChild(item);
      }
      
      document.body.appendChild(menu);
      
      const rect = element.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const top = rect.top + event.clientY;
      const left = rect.left + event.clientX;
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    });

    document.addEventListener('click', () => {
      if (this.menu) {
        this.menu.remove();
        this.menu = null;
      }
    });
  }
}
