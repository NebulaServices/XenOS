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
var CryptoJS = require("crypto-js");

var timingFlag = document.currentScript.src.endsWith('?flg');

// Launch internal apps
(async () => {
	// Proxy
	//await xen.apps.update("Proxies/Aero", undefined, false);
  
  await xen.awaitAll(

    // Preload backgrounds 
    xen.settings.init(),
    
    // Prepare internal apps
    
    xen.apps.update("Xen/Settings", undefined, false),
  	xen.apps.update("Xen/notes", undefined, false),
  	xen.apps.update("Xen/Store", undefined, false),
  	xen.apps.update("Xen/Testflight", undefined, false),
  	xen.apps.update("Xen/Welcome", undefined, false),
    xen.apps.update("Kleki/Kleki", undefined, false),
  	xen.apps.update("Velocity/Velocity", undefined, false),
    
    // Load doc
    
  	xen.dock.loadNative(),
    xen.apps.start()
  );

  // Detect Platform
  xen.platform = await window.__XEN_WEBPACK.core.platform();
  
	// Welcome the user :)
	await window.xen.apps.launch("Xen/Welcome");
  const lockscreen = document.getElementById("os-lockscreen");
  const preloader = document.getElementById("os-pre");
  setTimeout(() => {
    preloader.style.transition = '1s ease-in-out';
  	preloader.style.opacity = 0;
  	desk.style.transition = "all .5s ease 0s;";
  
  	setTimeout(() => {
  		preloader.style.display = "none";
  	}, 1000);
  }, (timingFlag?0:1300));

})();


window.addEventListener('DOMContentLoaded', (event) => {
   function decodePassword(encodedPassword) {
 const key = localStorage.getItem("XSKEY");
     var bytes  = CryptoJS.AES.decrypt(encodedPassword, key);
var originalText = bytes.toString(CryptoJS.enc.Utf8);
     return originalText;
}


  
var flag = localStorage.getItem('passwordSet')
  console.log(flag)
var psw = localStorage.getItem('_SXenPass')
var input = document.getElementById('lockscreenInput')
console.log(input)
var _lockScreen = document.getElementById('os-lockscreen')
var lockCir = document.getElementById('locksmith')
if (flag === "true"){
  _lockScreen.style.display = 'flex'
console.log('password required')
var passed = false;

function pwBypass() {
 alert('TAMPERING DETECTED \n ')
  const today = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
const longFormDate = today.toLocaleDateString('en-US', options);
xen.fs.writeFile('tamper.xlog', '#### Last Tamper Detection: ' + longFormDate)

setInterval(location.reload(), 500)
  

}

const observer = new MutationObserver((mutations) => {
  if (passed) return;
  
  for (var mutation of mutations) {
    if (mutation.type=='attributes'&&mutation.attributeName=='style') {
      var node = mutation.target;
      if (node==_lockScreen||node==lockCir) pwBypass();

      if (node.id=='os-body'||node.id=='os-setup'||node=='os-preload') pwBypass();
    }

    if (mutation.type=='childList'&&mutation.removedNodes.length) {
      for (var node of mutation.removedNodes) {
        if (!node instanceof HTMLElement) continue;

        if (node.id=='os-lockscreen'||node.id=='lockscreenInput'||node.id=='locksmith'||node.id=='WelcomeBackUser') pwBypass();
        if (1) continue;
      }
    }
  }
});

observer.observe(document.documentElement, {attributes: true, subtree: true, childList: true});
  
const ee = window.addEventListener("keyup", (event) => {
  
  console.log(psw)
  console.log(input.value)
  

  if (input.value == decodePassword(psw)) {
    input.disabled = true; 
    passed = true;
    	lockCir.style.border = '4px solid #00ff31';
     setTimeout(() => {
    _lockScreen.style.transition = '1s ease-in-out';
  	_lockScreen.style.opacity = 0;
  	
  
  	setTimeout(() => {
  		_lockScreen.style.display = "none";
  	}, 1000);
  }, 300);

    
  } else{
    if (event.key == 'Enter'){
      	input.disabled = true;
     setTimeout(() => {
  
  	
      document.getElementById('lockscreenInput').style = 'animation:wrongPw .9s cubic-bezier(0.11, 0, 0.5, 0) 0s 1 normal forwards;background: #ff7575b8;'
      
      setTimeout(() => {
  	 input.style = ''
        	input.disabled = false;
  	}, 900);
       }, 1000);
    }
  }
})

  console.log(ee)
} else {
  passed = true;
  _lockScreen.style.display = 'none'
}


});

