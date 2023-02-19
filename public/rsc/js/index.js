// commands
document.addEventListener("keydown", function(event) {
  if (event.ctrlKey && event.altKey && event.key === "c") {
    console.log("commander")
  let commandValue = prompt("Please enter the command you wish to execute");
if (commandValue === ""){
  alert('Error: \n not valid function command')
} else {
  const res = eval(commandValue);
  alert("Sucess. Result:\n"+res)
}
  }
});



function getCurrentTime() {
  const date = new Date();
  const options = {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return date.toLocaleString("en-US", options);
}
document.addEventListener("DOMContentLoaded", function() {
  const timeText = document.getElementById("timeIndicator");
  function updateTime() {
    timeText.innerText = getCurrentTime();
  }

  Element.prototype.insertAfter = function(element, reference) {
    this.insertBefore(element, reference.nextSibling);
  };

  /*xen.apps.update('Xen/notes');
  xen.apps.update('Xen/Store');
  xen.apps.update('Xen/Testflight');
    */

  setInterval(updateTime, 1000);
  // XEN INIT
  xen.system.begin();


  let className = "os-dock-item";
  let elements = document.getElementsByClassName(className);
  let elementIDs = [];
  for (let i = 0; i < elements.length; i++) {
    elementIDs.push(elements[i].id);
    console.log(elements[i].id)
  }

  let dockItem;
  elementIDs.forEach(function(id) {
    let element = document.getElementById(id);
    element.addEventListener("contextmenu", function(event) {
      event.preventDefault();
      if (dockItem) {
        dockItem.style.display = "none";
      }
      dockItem = element.getElementsByClassName("os-dock-tooltip")[0];
      dockItem.style.display = "block";

      document.addEventListener("click", function(event) {
        try {
          if (!dockItem.contains(event.target)) {
            dockItem.style.display = "none";
            dockItem = null;
          }
        }
        catch (e) {
          console.log(e)
        }
      });
    });
  });


  // Okay, so the Event is now renamed to WindowRegistration, and the event caries the object windowName, (so you'd do `event.windowName`)
  let __uni_windows = [];

  let focusedWindow = null;
  let osHeader = document.getElementById("osActiveApp");
  function handleWindowClick(win) {
    if (focusedWindow) {
      focusedWindow.style.zIndex = "1";
      focusedWindow.style.filter = "brightness(.8)";
    }
    win.style.zIndex = "100";
    win.style.filter = "brightness(1)";
    osHeader.innerText = win.id;
    document.title = `${win.id} | XenOS`;
    focusedWindow = win;
  }
  function handleExit() {
    setTimeout(function() {
      osHeader.innerText = "XenOS";
      document.title = `Desktop | XenOS`;
      console.log("close");
    }, 100);
  }
  document.addEventListener("WindowClose", function(e) {
    handleExit();
  });
  document.addEventListener("keydown", function(event) {
    if (event.metaKey && event.key === "m") {
      console.log("Command + Shift + M combination detected!");
    }
  });
  function initWindow(_win) {
    const win = document.getElementById(_win);
    __uni_windows.push(win);
    const iframes = document.querySelectorAll("iframe");
    const navbar = win.querySelector(".box-header-title");
    let startX, startY;

    navbar.addEventListener("mousedown", e => {
      if (win.style.transform == 'scale(0.1)') return;
      if (!e.target.classList.contains('box-header-title')) return;

      iframes.forEach(function(iframe) {
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
      iframes.forEach(function(iframe) {
        iframe.style.pointerEvents = "auto";
      });
    });

    const handleMove = e => {
      let left = e.clientX - startX;
      let top = e.clientY - startY;

      requestAnimationFrame(() => {
        win.style.position = `absolute`;
        win.style.top = `${top}px`;
        win.style.left = `${left}px`;
      });
    };

    win.style.zIndex = "1";
    win.style.transition = "all 0.001s ease-in-out";
    navbar.addEventListener("dblclick", event => {
      win.style.width = "99.9%";
      win.style.height = "80%";
      win.style.top = "29px";
      win.style.left = "3px";
      setTimeout(() => {
        win.style.transition = "";
      }, 500);
    });
    win.addEventListener("click", () => {
      handleWindowClick(win);
    });
  }

  const os_desk = document.getElementById("os-desktop");

  os_desk.addEventListener("NewWindow", e => {
    console.log(e.detail.text);
    initWindow(e.detail.text);
  }, true);
});

const btn = document.getElementById("launchpadButton");
const lp = document.getElementById("launchpad-overlay");

console.log(btn);

// btn.addEventListener("click", function (e) {
//   console.log('click')
//   if (lp.style.display == 'flex') {
//       xen.system.launchpad(false)
//   } else {
//       xen.system.launchpad(true)
//   }

// });
