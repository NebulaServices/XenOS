// System SubAPI
window.__XEN_WEBPACK.core.System = class System {
	constructor() {
		this.focusedWindow = null;
		this.osHeader = document.getElementById("osActiveApp");
	}

	begin() {
    

    
		console.log("Initializing XenOS");

		console.log("Getting Windows");
		const windowData = xen.windowManager.windows;
		localStorage.setItem("xen_window_data", JSON.stringify(windowData));
		const inStorageWindowData_Debug =
			localStorage.getItem("xen_window_data");

		console.log("Stored Window Data", inStorageWindowData_Debug);
		console.log("Registering Capture");
		console.log("Registering windowManager");
    console.log("Registering ErrorManager");
		console.log("Inserting DefaultWindow");

		document.querySelector(".os-setup").style.transition = "1s ease-in-out";

		console.log("Initialization complete");
		console.log("Clearing Console");

		console.log(
			"%cWelcome to XenOS",
			"color:black; background-color:white; padding:5px; border-radius: 5px; line-height: 26px; font-size:30px;"
		);

		return true;
	}

	register(name, posX, posY, location, native, width = '800px', height = '500px') {
		let check = document.getElementById(name);
		if (check === null) {
			if ((name, posX, posY == null)) {
				throw new TypeError(
					"Failed to register: \n missing required arguments"
				);
			} else {
				// Where a new app is created in the UI
				const desk = document.getElementById("os-desktop");
				try {
					let injectCode = new Function(`const thisAppName = this.dataset.appname;xen.windowManager.focus(thisAppName);/*xen.windowManager.modWin(thisAppName, "zIndex", this.style.zIndex);*/xen.windowManager.modWin(thisAppName, "locX", this.style.left);xen.windowManager.modWin(thisAppName, "locY", this.style.top);`);
					let closeCode = new Function(`const thisAppName = this.dataset.appname;
xen.system.unregister("${name}");
document.dispatchEvent(
	new CustomEvent("WindowClose", {
		window: thisAppName,
		detail: { text: "${name}" },
	})
);`);
					let miniCode = new Function(`xen.apps.minimize('${name}');`);
					let master = document.createElement("div");
					let headerBox = document.createElement("div");
					let headerTitle = document.createElement("div");
					let headerTitleText = document.createTextNode(name);
					let boxBody = document.createElement("div");
					let closeSpan = document.createElement("span");
					let miniSpan = document.createElement("span");
					let contentFrame = document.createElement("iframe");

					master.dataset.appname = name;
					master.classList.add("drag");
					master.classList.add("box");
					master.id = name;

          master.style.width = width;
          master.style.height = height;
          
					desk.appendChild(master);

					headerBox.classList.add("box-header");
					headerTitle.classList.add("box-header-title");
					boxBody.classList.add("box-body-inner");
					master.appendChild(headerBox);
					headerBox.appendChild(headerTitle);

          master.insertAdjacentHTML('afterbegin', `<div class="leftResize resize"></div><div class="topResize resize"></div><div class="rightResize resize"></div><div class="bottomResize resize"></div>`);
          master.insertAdjacentHTML('afterbegin', `<div class="topLeftResize dresize"></div><div class="topRightResize dresize"></div><div class="bottomRightResize dresize"></div><div class="bottomLeftResize dresize"></div>`);

          xen.system.resizeListener(master);

					headerTitle.appendChild(headerTitleText);
					headerTitle.appendChild(closeSpan);
					headerTitle.appendChild(miniSpan);
					closeSpan.classList.add("os-exit");
					miniSpan.classList.add("os-mini");
					master.onclick = injectCode;
					closeSpan.onclick = closeCode;
					miniSpan.onclick = miniCode;
          
					closeSpan.innerHTML = `<svg style="width: 15px;height: 15px;" xmlns="http://www.w3.org/2000/svg" width="188" height="185" viewBox="0 0 188 185" fill="none">
	<rect width="188" height="185" rx="92.5" fill="#F46868"></rect>
	</svg>`;
					miniSpan.innerHTML = `<svg style="width: 15px;height: 15px;" xmlns="http://www.w3.org/2000/svg" width="188" height="185" viewBox="0 0 188 185" fill="none">
	<rect width="188" height="185" rx="92.5" fill="#FFD43C"></rect>
	</svg>`;
					headerBox.appendChild(boxBody);

					boxBody.appendChild(contentFrame);
					contentFrame.src = location || "about:blank";
          contentFrame.classList.add('appFrame')
					contentFrame.contentWindow.addEventListener(
						"error",
						function (event) {
							console.log(
								"An error occurred in the iframe:",
								event.message
							);
						}
					);
					xen.windowManager.addWindow(
						name,
						master,
						"locX",
						posX,
						"locY",
						posY,
						native
					);
          xen.windowManager.modWin(name,'contentWindow', contentFrame)

					desk.dispatchEvent(
						new CustomEvent("NewWindow", {
							window: name,
							detail: { text: name },
						})
					);

					return master;
				} catch (e) {
					console.log("Xen Registration Error: \n" + e);
				}
			}
		} else {
			if (xen.windowManager.windows[name].minimized == true) {
				document.getElementById(name).style.display = "block";
				xen.windowManager.windows[name].minimized = false;
			} else {
				throw new TypeError(
					"Failed to register: \n An app or window with the same name already exists."
				);
			}
		}
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

	launchpad(status) {
		const lp = document.getElementById("launchpad-overlay");
		if (status == true) {
			lp.style.display = "flex";
		} else {
			lp.style.display = "none";
		}
	}

	focus(win) {
		var focusedWindow = this.focusedWindow;

		if (focusedWindow) {
			focusedWindow.style.filter = "brightness(.9)";
		}
		win.style.filter = "brightness(1)";
		focusedWindow = win;

		const osHeader = this.osHeader;
		osHeader.innerText = win.id;

		document.title = `${win.id} | XenOS`;
	}

  #restart() {
    document.documentElement.replaceWith(document.documentElement.cloneNode(true));
    
    var links = document.getElementsByTagName("link"); for (var i = 0; i < links.length;i++) { var link = links[i]; if (link.rel === "stylesheet") {link.href+='?'}}

    var scripts = document.getElementsByTagName("script"); for (var i = 0; i < scripts.length;i++) { var script = scripts[i]; if (script.type !== "application/json") {script.href+='?flg'}}
  }

  requestRestart(app) {
    this.#restart();
  }
};
