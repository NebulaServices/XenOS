const defaultWin = document.getElementById("defaultWindow");
const desk = document.getElementById("os-desktop");

function errorHandler(event) {
	event.preventDefault();

	const style = `color:white;font-weight:bold;background-color:red;font-size:20px;`;

	console.error(
		"Catastrophic error while initializing \n" +
			event.stack +
			"%c \n CATASTROPHIC ERROR.. XENOS WILL NOT FUNCTION!",
		style
	);
}

window.__XEN_WEBPACK.html.defaultWin = defaultWin;
window.__XEN_WEBPACK.html.desk = desk;

// Launch internal apps
(async () => {
	// Proxy
	//await xen.apps.update("Proxies/Aero", undefined, false);

	// Prepare internal apps
	await xen.apps.update("Xen/notes", undefined, false);
	await xen.apps.update("Xen/Store", undefined, false);
	await xen.apps.update("Xen/Testflight", undefined, false);
	await xen.apps.update("Xen/Welcome", undefined, false);
	await xen.apps.update("Xen/Settings", undefined, false);
	await xen.apps.update("Velocity/Velocity", undefined, false);

	// Load doc
	await window.xen.dock.loadNative();

	// Welcome the user :)
	await window.xen.apps.launch("Xen/Welcome");

  setTimeout(() => {
    preloader.style.transition = '1s ease-in-out';
  	preloader.style.opacity = 0;
  	desk.style.transition = "all .5s ease 0s;";
  
  	setTimeout(() => {
  		preloader.style.display = "none";
  	}, 1000);
  }, 300);

})();

const preloader = document.getElementById("os-pre");