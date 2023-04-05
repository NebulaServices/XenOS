// System SubAPI
window.__XEN_WEBPACK.core.System = class System {
	constructor() {
		this.focusedWindow = null;
		this.osHeader = document.getElementById("osActiveApp");
    this.desktop = document.getElementById('os-desktop')
	}

	begin() {
  document.querySelector(".os-setup").style.transition = "1s ease-in-out";
  console.log(
    "%cWelcome to XenOS",
    "color:black; background-color:white; padding:5px; border-radius: 5px; line-height: 26px; font-size:30px;"
  );

  return true;
}

 getCloseSVG() {
  return `<svg style="width: 15px;height: 15px;" xmlns="http://www.w3.org/2000/svg" width="188" height="185" viewBox="0 0 188 185" fill="none">
    <rect width="188" height="185" rx="92.5" fill="#F46868"></rect>
  </svg>`;
}

 getMiniSVG() {
  return `<svg style="width: 15px;height: 15px;" xmlns="http://www.w3.org/2000/svg" width="188" height="185" viewBox="0 0 188 185" fill="none">
    <rect width="188" height="185" rx="92.5" fill="#ffcd5b"></rect>
  </svg>`;
}

	register(name, posX, posY, location, native, width = '800px', height = '500px') {
	const injectCode = () => {
    const thisAppName = this.dataset.appname;
    xen.windowManager.focus(thisAppName);
    xen.windowManager.modWin(thisAppName, 'locX', this.style.left);
    xen.windowManager.modWin(thisAppName, 'locY', this.style.top);
  };
  
 
  
  const masterWindowContainer = document.createElement('div');
  const contentFrame = document.createElement('iframe');
  const processID = xen.windowManager.spawnProcess(
    name,
    masterWindowContainer,
    'locX',
    posX,
    'locY',
    posY,
    native,
    'contentWindow', 
    contentFrame
  );
  const closeCode = () => {
    const thisAppName = processID;
    xen.system.unregister(thisAppName);
    document.dispatchEvent(new CustomEvent('WindowClose', { window: thisAppName, detail: { text: thisAppName } }));
  };
  
  const miniCode = () => {
    xen.apps.minimize(processID);
  };
  const headerBox = document.createElement('div');
  const headerTitle = document.createElement('div');
  const headerTitleText = document.createTextNode(name);
  const boxBody = document.createElement('div');
  const closeSpan = document.createElement('span');
  const miniSpan = document.createElement('span');

  masterWindowContainer.dataset.appname = name;
  masterWindowContainer.classList.add('drag', 'box');
  masterWindowContainer.id = processID;
  masterWindowContainer.style.width = width;
  masterWindowContainer.style.height = height;
  this.desktop.appendChild(masterWindowContainer);
  
  headerBox.classList.add('box-header');
  headerTitle.classList.add('box-header-title');
  boxBody.classList.add('box-body-inner');
  headerBox.appendChild(headerTitle);
  headerTitle.appendChild(headerTitleText);
  headerTitle.appendChild(closeSpan);
  headerTitle.appendChild(miniSpan);
  
  closeSpan.classList.add('os-exit');
  miniSpan.classList.add('os-mini');
  
  closeSpan.innerHTML = this.getCloseSVG();
  miniSpan.innerHTML = this.getMiniSVG();
  
  closeSpan.addEventListener("click", closeCode);
  miniSpan.addEventListener("click", miniCode);
  
  masterWindowContainer.append(headerBox, boxBody);
  boxBody.appendChild(contentFrame);
  masterWindowContainer.append(
    headerBox,
    boxBody,
    // Create and add the resizing divs to the container
    ...['left', 'top', 'right', 'bottom', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft'].map(direction => {
      const div = document.createElement('div');
      div.classList.add(direction.includes('top') ? 'resize' : 'dresize', direction + 'Resize');
      return div;
    })
  );

  // Attach the resize listener to the container
  xen.system.resizeListener(masterWindowContainer); 

  // Add event listeners to the content frame
  contentFrame.src = location || 'about:blank';
  contentFrame.classList.add('appFrame');
  contentFrame.contentWindow.addEventListener('error', (event) => {
    console.log('An error occurred in the iframe:', event.message);
  });

    	this.desktop.dispatchEvent(
						new CustomEvent("NewWindow", {
							window: processID,
							detail: { text: processID },
						})
					);


    
					return masterWindowContainer;
        
		}
	

  resizeListener(master) {
    var left = master.querySelector('.leftResize'),
      right = master.querySelector('.rightResize'),
      top = master.querySelector('.topResize'),
      bottom = master.querySelector('.bottomResize');

    var topLeft = master.querySelector('.topLeftResize'),
      topRight = master.querySelector('.topRightResize'),
      bottomLeft = master.querySelector('.bottomLeftResize'),
      bottomRight = master.querySelector('.bottomRightResize');

    [left, right, top, bottom].forEach((side, index) => {
      var s = ['left', 'right', 'top', 'bottom'][index];
      
      var startX;
      var startY;
      var computed;
      var startHeight;
      var startWidth;
      var startTop;
      var startLeft;
      
      var mousemove = function(e) {

        requestAnimationFrame(() => {
          if (s=='top') {
            var height = (parseInt(startHeight.replace('px', '')) - (e.clientY - startY));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = (height>70?parseInt(startTop.replace('px', '')) + (e.clientY - startY):'')+'px';
          } else if (s=='bottom') {
            var height = (parseInt(startHeight.replace('px', '')) + (e.clientY - startY));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = startTop;
          } else if (s=='left') {
            var width = (parseInt(startWidth.replace('px', '')) - (e.clientX - startX));
            master.style.width = (width>70?width:70)+'px';
            master.style.left = (width>70?parseInt(startLeft.replace('px', '')) + (e.clientX - startX):'')+'px';
          } else if (s=='right') {
            var width = (parseInt(startWidth.replace('px', '')) + (e.clientX - startX));
            master.style.width = (width>70?width:70)+'px';
            master.style.left = startLeft;
          }
        });
      };
    
      document.addEventListener('mousedown', function(e) {
        if (e.target!==side) return;

        computed = window.getComputedStyle(master);

        startHeight = computed.height+'';
        startWidth = computed.width+'';
        startTop = computed.top+'';
        startLeft = computed.left+'';
        
        startX = e.clientX;
        startY = e.clientY;
        
  			master.querySelectorAll('iframe').forEach(function(iframe) {
  				iframe.style.pointerEvents = "none";
  			});
        
        document.addEventListener('mousemove', mousemove);
      });

      document.addEventListener('mouseup', function(e) {
        if (!startX&&!startY) return

        document.removeEventListener('mousemove', mousemove);   
        
  			master.querySelectorAll('iframe').forEach(function(iframe) {
  				iframe.style.pointerEvents = "all";
  			});     
      });
    });

    [topLeft, topRight, bottomLeft, bottomRight].forEach((side, index) => {
      var s = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'][index];
      
      var startX;
      var startY;
      var computed;
      var startHeight;
      var startWidth;
      var startTop;
      var startLeft;
      
      var mousemove = function(e) {
        requestAnimationFrame(() => {
         if (s=='topLeft') {
            var height = (parseInt(startHeight.replace('px', '')) - (e.clientY - startY));
            var width = (parseInt(startWidth.replace('px', '')) - (e.clientX - startX));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = (height>70?parseInt(startTop.replace('px', '')) + (e.clientY - startY):'')+'px';
            master.style.width = (width>70?width:70)+'px';
            master.style.left = (width>70?parseInt(startLeft.replace('px', '')) + (e.clientX - startX):'')+'px';
          } else if (s=='topRight') {
            var height = (parseInt(startHeight.replace('px', '')) - (e.clientY - startY));
            var width = (parseInt(startWidth.replace('px', '')) + (e.clientX - startX));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = (height>70?parseInt(startTop.replace('px', '')) + (e.clientY - startY):'')+'px';
            master.style.width = (width>70?width:70)+'px';
            master.style.left = startLeft;
          } else if (s=='bottomLeft') {
            var height = (parseInt(startHeight.replace('px', '')) + (e.clientY - startY));
            var width = (parseInt(startWidth.replace('px', '')) - (e.clientX - startX));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = startTop
            master.style.width = (width>70?width:70)+'px';
            master.style.left = (width>70?parseInt(startLeft.replace('px', '')) + (e.clientX - startX):'')+'px';
          } else if (s=='bottomRight') {
            var height = (parseInt(startHeight.replace('px', '')) + (e.clientY - startY));
            var width = (parseInt(startWidth.replace('px', '')) + (e.clientX - startX));
            master.style.height = (height>70?height:70)+'px';
            master.style.top = startTop
            master.style.width = (width>70?width:70)+'px';
            master.style.left = startLeft;
          }
        });
      };
    
      document.addEventListener('mousedown', function(e) {
        if (e.target!==side) return;

        computed = window.getComputedStyle(master);

        startHeight = computed.height+'';
        startWidth = computed.width+'';
        startTop = computed.top+'';
        startLeft = computed.left+'';
        
        startX = e.clientX;
        startY = e.clientY;
        
  			master.querySelectorAll('iframe').forEach(function(iframe) {
  				iframe.style.pointerEvents = "none";
  			});
        
        document.addEventListener('mousemove', mousemove);
      });

      document.addEventListener('mouseup', function(e) {
        if (!startX&&!startY) return;

        document.removeEventListener('mousemove', mousemove);   
        
  			master.querySelectorAll('iframe').forEach(function(iframe) {
  				iframe.style.pointerEvents = "all";
  			});     
      });
    });
  }

	unregister(appName) {
		let win = document.getElementById(appName);

		win.innerHTML = ""; // Clear the content of the div
		win.remove(); // Remove the div from the DOM
		xen.windowManager.removeWindow(appName);

		console.log("Sucessfully unregistered window: " + appName);
	}


};