const preloader = document.getElementById("os-pre");
const desk_defaultWindow = document.getElementById("defaultWindow");
const os_preloader_txt = document.getElementById("os-pre-text");
const desk = document.getElementById("os-desktop");

if (
	window.CSS &&
	window.CSS.supports &&
	window.CSS.supports("transform", "translateZ(0)")
) {
	const style = `color:white;font-weight:bold;background-color:green;font-size:20px;`;
	console.log("%c Hardware acceleration is enabled.", style);
} else {
	const errorStyle = `color:white;font-weight:bold;background-color:red;font-size:20px;`;
	console.log(
		"WARNING! HARDWARE EXEMPTION DETECTED! \n %c XENOS MAY NOT FUNCTION AS INTENDED!",
		errorStyle
	);
}

function errorHandler(event) {
	event.preventDefault();

	const style = `color:white;font-weight:bold;background-color:red;font-size:20px;`;
	console.error(
		"Catastrophic error while initializing \n" +
			event.stack +
			"%c \n CATASTROPHIC ERROR.. XENOS WILL NOT FUNCTION!",
		style
	);

	preloader.style.color = "red";
	os_preloader_txt.innerText = "Catastrophic Error!";
}
//window.addEventListener("error", errorHandler);

setTimeout(() => {
	window.removeEventListener("error", errorHandler);
}, 5000);

window.__XEN_WEBPACK.html.os_preloader = preloader;
window.__XEN_WEBPACK.html.desk_defaultWindow = desk_defaultWindow;
window.__XEN_WEBPACK.html.os_desk = desk;

navigator.serviceWorker.addEventListener("message", function (event) {
	console.log(event.data.log);
});

var start = new Date().getTime();

console.log('Start LOAD: '+start);
console.log('Start TIME: '+(start - start)+'ms');

setTimeout(async () => {
  await xen.apps.update('Xen/notes', undefined, false);
  await xen.apps.update('Xen/Store', undefined, false);
  await xen.apps.update('Xen/Testflight', undefined, false);
  await xen.apps.update('Xen/Welcome', undefined, false);
  await xen.apps.update('Xen/Settings', undefined, false);
  await xen.apps.update('Velocity/Velocity', undefined, false);

  await window.xen.dock.loadNative();

  var core = new Date().getTime();

  await window.xen.apps.launch('Xen/Welcome');
  
  console.log('Core LOAD: '+core);
  console.log('Core TIME: '+(core - start)+'ms');
  
  setTimeout(async () => {
    
  	preloader.style.opacity = 0;
    
  	desk.style.transition = "all .5s ease 0s;";

    setTimeout(() => {
    	preloader.style.display = "none";

      var finish = new Date().getTime();
      
      console.log('Finish LOAD: '+finish);
      console.log('Finish TIME: '+(finish - start)+'ms');
      
    }, 1000);

  }, 1300);
}, 500);