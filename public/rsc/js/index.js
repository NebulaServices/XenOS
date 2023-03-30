// Commands
// deprecated
document.addEventListener("keydown", event => {
	if (event.ctrlKey && event.altKey && event.key === "c") {
		let commandValue = prompt(
			"Please enter the command you wish to execute"
		);
		if (commandValue === "") {
			alert("Error: \n not valid function command");
		} else {
			const res = eval(commandValue);
			alert("Sucess. Result:\n" + res);
		}
	}
});

document.addEventListener("DOMContentLoaded", () => {


  
const INACTIVITY_TIME = 300000; 
var hadNotice = false;

let timeoutID = null;

// // function resetTimeout() {
// //   clearTimeout(timeoutID);
// //   timeoutID = setTimeout(() => {
// //     console.log('User inactive');
// //      hadNotice = "false";
// //     document.dispatchEvent(new Event('userInactive'));
// //   }, INACTIVITY_TIME);
// // }

// // function handleUserActivity() {
// //   if (hadNotice === "false"){
// //      console.log('User active');
// //   document.dispatchEvent(new Event('userActive'));
// //   resetTimeout();
// //      hadNotice = "true";
// //   }
 
// // }

// // document.addEventListener('mousemove', handleUserActivity);
// // document.addEventListener('keydown', handleUserActivity);
// // document.addEventListener('click', handleUserActivity);
// // document.addEventListener('touchstart', handleUserActivity);

// resetTimeout(); // start tracking inactivity on page load


  
var _ic = document.getElementById('logoButton')
var _to = document.getElementById('tboptions')
var _tbo_displaying = false; 
_ic.onclick = function(){
  _to.style.display = 'flex'
  _tbo_displaying = "true";
}

_to.addEventListener('click', function(event){
  console.log('menu')
  _to.innerHTML = `
  XenOS ${xen.information.releaseName} v${xen.information.version} `
});
  
document.getElementById('os-desktop').addEventListener('click', function(event){

  if(_tbo_displaying === "true"){
     _to.style.display = 'none'
    _tbo_displaying = "false";
    _to.innerHTML = `
  
      <div class="taskBarOption"> About </div> 
<div class="taskBarOption"> App store </div>
        <div class="taskBarOption"> Settings </div>
        <hr> 
         <div class="taskBarOption"> Sleep </div> 
              <div class="taskBarOption"> Save and Close </div> 
      `
    
  }
})


  
	Element.prototype.insertAfter = function(el, ref) {
		this.insertBefore(el, ref.nextSibling);
	};

	// Update time
	setInterval(() => {
		const timeText = document.getElementById("timeIndicator");
		timeText.innerText = (() => {
			const date = new Date();
			const options = {
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				hour: "numeric",
				minute: "numeric",
				hour12: true,
			};
			return date.toLocaleString("en-US", options);
		})();
	}, 1000);

	// Xen Init
	xen.system.begin();

	let className = "os-dock-item";
	let els = document.getElementsByClassName(className);
	let elIDS = [];
	for (let i = 0; i < els.length; i++) {
		elIDS.push(els[i].id);
		console.log(els[i].id);
	}

	let dockItem;
	elIDS.forEach(id => {
		let el = document.getElementById(id);
		el.addEventListener("contextmenu", event => {
			event.preventDefault();

			if (dockItem) dockItem.style.display = "none";
			dockItem = el.getElementsByClassName("os-dock-tooltip")[0];
			dockItem.style.display = "block";

			document.addEventListener("click", event => {
				try {
					if (!dockItem.contains(event.target)) {
						dockItem.style.display = "none";
						dockItem = null;
					}
				} catch (err) {
					console.log(err);
				}
			});
		});
	});

	// Okay, so the Event is now renamed to WindowRegistration, and the event caries the object windowName, (so you'd do `event.windowName`)
	let __uni_windows = [];

	let focusedWin = null;
	let xenHeader = document.getElementById("osActiveApp");
  
	window.xen.windowManager.handleWindowClick = function handleWindowClick(win) {
    if (!win) return;
		if (focusedWin) {
			focusedWin.style.zIndex = "1";
			focusedWin.style.filter = "brightness(.8)";
      focusedWin.querySelectorAll('iframe').forEach(e=>e.style.pointerEvents='none');
		}
		win.style.zIndex = "100";
		win.style.filter = "brightness(1)";

		// Title
		xenHeader.innerText = win.id;
		document.title = `${win.id} | XenOS`;

		focusedWin = win;
	}
	function handleExit() {
		setTimeout(function () {
			xenHeader.innerText = "XenOS";
			document.title = `Desktop | XenOS`;
			console.log("close");
		}, 100);
	}
	document.addEventListener("WindowClose", function (e) {
		handleExit();
	});
	document.addEventListener("keydown", function (event) {
		if (event.metaKey && event.key === "m") {
			console.log("Command + Shift + M combination detected!");
		}
	});
	function initWindow(_win) {
		const win = document.getElementById(_win);
		__uni_windows.push(win);
		const iframes = win.querySelectorAll("iframe");
		const navbar = win.querySelector(".box-header-title");
		let startX, startY;

		navbar.addEventListener("mousedown", e => {
			if (win.style.transform == "scale(0.1)") return;
			if (!e.target.classList.contains("box-header-title")) return;

      if(e.which!==1) return;

			iframes.forEach(function (iframe) {
				iframe.style.pointerEvents = "none";
			});

			startX = e.clientX - win.offsetLeft;
			startY = e.clientY - win.offsetTop;

			document.addEventListener("mousemove", handleMove, true);
			document.addEventListener("mouseup", () => {
				document.removeEventListener("mouseup", this);
				document.removeEventListener("mousemove", handleMove, true);
			});
		});

		navbar.addEventListener("mouseup", e => {
      if (e.target instanceof window.SVGSVGElement) return;
      if (e.target instanceof window.SVGRectElement) return;
      if (e.target.classList.contains('os-mini')) return;

      if (xen.apps.minimized.includes(win)) return;
      
			iframes.forEach(function (iframe) {
				iframe.style.pointerEvents = "auto";
			});
		});

		const handleMove = e => {
			let left = e.clientX - startX;
			let top = e.clientY - startY;

            if (top<32) top = 32;

			requestAnimationFrame(() => {
				win.style.position = `absolute`;
				win.style.top = `${top}px`;
				win.style.left = `${left}px`;
			});
		};

		win.style.zIndex = "1";
		win.style.transition = "all 0.001s ease-in-out";
		navbar.addEventListener("dblclick", () => {
			win.style.width = "99.9%";
			win.style.height = "80%";
			win.style.top = "29px";
			win.style.left = "3px";

			// TODO: Convert this to CSS
			setTimeout(() => {
				win.style.transition = "";
			}, 500);
		});
		win.addEventListener("mousedown", () => {
			window.xen.windowManager.handleWindowClick(win);
		});

    win.addEventListener("click", (e) => {
      console.log('eee');

      if (e.target instanceof window.SVGSVGElement) return;
      if (e.target instanceof window.SVGRectElement) return;
      if (e.target.classList.contains('os-mini')) return;

      if (xen.apps.minimized.includes(win)) return;
      
      iframes.forEach(e=>e.style.pointerEvents='auto');
    });
	}

	const xenDesk = document.getElementById("os-desktop");

	xenDesk.addEventListener(
		"NewWindow",
		e => {
			console.log(e.detail.text);
			initWindow(e.detail.text);
		},
		true
	);
});

const btn = document.getElementById("launchpadButton");
const lp = document.getElementById("launchpad-overlay");

window.__XEN_WEBPACK.core.platform = async function() {
  return navigator.userAgentData.platform;
}

window.xen.awaitAll = async function(...args) {
  return (await Promise.allSettled(args))?true:false;
}

window.xen.wait = (ms) => new Promise(e=>setTimeout(()=>e(), ms));

window.xen.system.details = () => {
  return require('device-uuid')
}

window.xen.blob64 = function(file) {
  return new Promise(async (e) => {
    fetch(file).then(e=>e.blob()).then(blob => {
      const fr = new FileReader();
        
      fr.addEventListener("load", function(evt) {
        e(evt.target.result);
      }); 
        
      fr.readAsDataURL(blob);
    });
  });
}

/*
btn.addEventListener("click", () => xen.system.launchpad(lp.style.display !== 'flex'));
*/
var _title;
document.addEventListener('userInactive', function(){
  const frame = document.createElement("iframe");
 frame.src = "/saver.html";
  frame.style='overflow:none;outline:transparent;border:transparent;width:100%;height:100%;z-index:40000004;position: absolute;pointer-events:none;'
  frame.id='saverFrame'
  document.body.appendChild(frame);
  _title = document.title
  document.title = 'sleeping | XenOS'
})

document.addEventListener('userActive', function(){
  document.getElementById('saverFrame').remove()
  document.title = _title;
})

Object.prototype.toString = function (x, y) {
  return JSON.stringify(this, x, y);
}

xen.webpack = {require: __webpack_require__, modules: __webpack_modules__, cache: __webpack_module_cache__};



// Interceptors

