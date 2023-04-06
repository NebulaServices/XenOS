const xen = window.__XEN_WEBPACK;
const core = xen.core;

core.System = class System {
	constructor() {
		this.focusedWindow = null;
		this.osHeader = document.getElementById("osActiveApp");
		this.desktop = document.getElementById("os-desktop");
	}

	begin() {
		document.querySelector(".os-setup").style.transition = "1s ease-in-out";
		console.log(
			"%cWelcome to XenOS",
			"color:black; background-color:white; padding:5px; border-radius: 5px; line-height: 26px; font-size:30px;"
		);

		return true;
	}

	createSVG(width, height, fillColor) {
		return `<svg style="width: ${width};height: ${height};" xmlns="http://www.w3.org/2000/svg" width="188" height="185" viewBox="0 0 188 185" fill="none">
      <rect width="188" height="185" rx="92.5" fill="${fillColor}"></rect>
    </svg>`;
	}

	getCloseSVG() {
		return this.createSVG("15px", "15px", "#F46868");
	}

	getMiniSVG() {
		return this.createSVG("15px", "15px", "#ffcd5b");
	}

	createWindowElement(tag, className) {
		const element = document.createElement(tag);
		if (className) {
			element.classList.add(...className.split(" "));
		}
		return element;
	}

	buildHeaderBox(headerTitle) {
		const headerBox = this.createWindowElement("div", "box-header");
		headerBox.appendChild(headerTitle);
		return headerBox;
	}

	buildCloseSpan(closeCode) {
		const closeSpan = this.createWindowElement("span", "os-exit");
		closeSpan.innerHTML = this.getCloseSVG();
		closeSpan.addEventListener("click", closeCode);
		return closeSpan;
	}

	buildMiniSpan(miniCode) {
		const miniSpan = this.createWindowElement("span", "os-mini");
		miniSpan.innerHTML = this.getMiniSVG();
		miniSpan.addEventListener("click", miniCode);
		return miniSpan;
	}

	buildBoxBody() {
		return this.createWindowElement("div", "box-body-inner");
	}

	handleWindowClose(processID) {
		this.unregister(processID);
		document.dispatchEvent(new CustomEvent("WindowClose", {
			window: processID,
			detail: {
				text: processID
			}
		}));
	}

	handleWindowMinimize(processID) {
		window.xen.apps.minimize(processID);
	}

	createResizeDivs() {
		return ['left', 'top', 'right', 'bottom', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft'].map(direction => {
			const div = document.createElement('div');
			div.classList.add(direction.includes('top') ? 'resize' : 'dresize', direction + 'Resize');
			return div;
		});
	}

	register(name, posX, posY, location, native, width = "800px", height = "500px") {

		const masterWindowContainer = this.createWindowElement("div", "drag box");

		const contentFrame = this.createWindowElement("iframe", "appFrame");
		const processID = window.xen.windowManager.spawnProcess(
			name,
			masterWindowContainer,
			"locX",
			posX,
			"locY",
			posY,
			native,
			"contentWindow",
			contentFrame
		);

		masterWindowContainer.dataset.appname = name;
		masterWindowContainer.id = processID;
		masterWindowContainer.style.width = width;
		masterWindowContainer.style.height = height;

		const headerTitle = this.createWindowElement("div", "box-header-title");
		const headerTitleText = document.createTextNode(name);
		headerTitle.appendChild(headerTitleText);

		const headerBox = this.buildHeaderBox(headerTitle);
		const closeSpan = this.buildCloseSpan(() => this.handleWindowClose(processID));
		const miniSpan = this.buildMiniSpan(() => this.handleWindowMinimize(processID));
		const boxBody = this.buildBoxBody();

		headerTitle.appendChild(closeSpan);
		headerTitle.appendChild(miniSpan);
		masterWindowContainer.append(headerBox, boxBody, ...this.createResizeDivs());

		this.resizeListener(masterWindowContainer);

		contentFrame.src = location || 'about:blank';
		contentFrame.name = "frame" + processID;
		contentFrame.frameBorder = "0";
		boxBody.appendChild(contentFrame);

		this.desktop.appendChild(masterWindowContainer);

		this.desktop.dispatchEvent(
			new CustomEvent("NewWindow", {
				window: processID,
				detail: {
					text: processID
				},
			})
		);

		return masterWindowContainer;
	}

	resizeListener(master) {
		const sides = ['left', 'right', 'top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

		const getSideElement = (master, side) => master.querySelector(`.${side}Resize`);

		const handleResizeStart = (e, computed) => {
			const startX = e.clientX;
			const startY = e.clientY;
			const startHeight = parseInt(computed.height);
			const startWidth = parseInt(computed.width);
			const startTop = parseInt(computed.top);
			const startLeft = parseInt(computed.left);

			master.querySelectorAll('iframe').forEach(iframe => {
				iframe.style.pointerEvents = "none";
			});

			return {
				startX,
				startY,
				startHeight,
				startWidth,
				startTop,
				startLeft
			};
		};

		const handleResizeEnd = (master) => {
			master.querySelectorAll('iframe').forEach(iframe => {
				iframe.style.pointerEvents = "all";
			});
		};

		const handleResize = (e, side, initial) => {
			requestAnimationFrame(() => {
				const {
					startX,
					startY,
					startHeight,
					startWidth,
					startTop,
					startLeft
				} = initial;
				const movementX = e.clientX - startX;
				const movementY = e.clientY - startY;
				const minSize = 70;

				const resizeFunctions = {
					'top': () => {
						const height = Math.max(startHeight - movementY, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop + (height > minSize ? movementY : 0)}px`;
					},
					'bottom': () => {
						const height = Math.max(startHeight + movementY, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop}px`;
					},
					'left': () => {
						const width = Math.max(startWidth - movementX, minSize);
						master.style.width = `${width}px`;
						master.style.left = `${startLeft + (width > minSize ? movementX : 0)}px`;
					},
					'right': () => {
						const width = Math.max(startWidth + movementX, minSize);
						master.style.width = `${width}px`;
						master.style.left = `${startLeft}px`;
					},
					'topLeft': () => {
						const height = Math.max(startHeight - movementY, minSize);
						const width = Math.max(startWidth - movementX, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop + (height > minSize ? movementY : 0)}px`;
						master.style.width = `${width}px`;
						master.style.left = `${startLeft + (width > minSize ? movementX : 0)}px`;
					},
					'topRight': () => {
						const height = Math.max(startHeight - movementY, minSize);
						const width = Math.max(startWidth + movementX, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop + (height > minSize ? movementY : 0)}px`;
						master.style.width = `${width}px`;
						master.style.left = `${startLeft}px`;
					},
					'bottomLeft': () => {
						const height = Math.max(startHeight + movementY, minSize);
						const width = Math.max(startWidth - movementX, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop}px`;
						master.style.width = `${width}px`;
						master.style.left = `${startLeft + (width > minSize ? movementX : 0)}px`;
					},
					'bottomRight': () => {
						const height = Math.max(startHeight + movementY, minSize);
						const width = Math.max(startWidth + movementX, minSize);
						master.style.height = `${height}px`;
						master.style.top = `${startTop}px`;
						master.style.width = `${width}px`;
						master.style.left = `${startLeft}px`;
					}
				};

				if (resizeFunctions.hasOwnProperty(side)) {
					resizeFunctions[side]();
				}
			});
		};

		sides.forEach(side => {
			const sideElement = getSideElement(master, side);
			let initial;

			document.addEventListener('mousedown', (e) => {
				if (e.target !== sideElement) return;

				const computed = window.getComputedStyle(master);
				initial = handleResizeStart(e, side, computed);
				document.addEventListener('mousemove', handleResizeWrapper);
			});

			const handleResizeWrapper = (e) => {
				handleResize(e, side, initial);
			};

			document.addEventListener('mouseup', (e) => {
				if (!initial) return;

				document.removeEventListener('mousemove', handleResizeWrapper);
				handleResizeEnd(master);
			});
		});
	}

	unregister(windowID) {
		const windowElement = document.getElementById(windowID);
		if (windowElement) {
			windowElement.remove();
		} else {
			console.warn(`Could not unregister window with ID ${windowID}, as it does not exist.`);
		}
	}
}