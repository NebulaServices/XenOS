module.exports = async function () {
  const defaultWin = document.getElementById("defaultWindow"),
    desk = document.getElementById("os-desktop");

  var CryptoJS = require("crypto-js");

  const preloader = document.getElementById("os-pre");

  window.addEventListener("DOMContentLoaded", () => {
    var flag = localStorage.getItem("passwordSet"),
      psw = localStorage.getItem("_SXenPass"),
      input = document.getElementById("lockscreenInput"),
      _lockScreen = document.getElementById("os-lockscreen"),
      lockCir = document.getElementById("locksmith"),
      catter = document.getElementById("errorCatter");

    catter.innerText = `System Information
      Release: ${xen.information.releaseName} 
      Version: ${xen.information.version}
      Connected: ${navigator.onLine} 
      Platform: ${navigator.platform} 
      Agent: ${navigator.userAgent}`;

    const decodePassword = (password) =>
      CryptoJS.AES.decrypt(password, localStorage.getItem("XSKEY")).toString(
        CryptoJS.enc.Utf8
      );

    if (flag === "true") {
      _lockScreen.style.display = "flex";

      var passed = false;

      async function pwBypass() {
        alert("TAMPERING DETECTED \n ");
        const today = new Date();
        const options = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          timeZoneName: "short",
        };
        const longFormDate = today.toLocaleDateString("en-US", options);
        xen.fs.writeFile(
          "tamper.xlog",
          "#### Last Tamper Detection: " + longFormDate
        );

        document.write();

        await xen.wait(900);

        return location.reload(true);
      }

      const observer = new MutationObserver((mutations) => {
        if (passed) return observer.disconnect();

        for (var mutation of mutations) {
          if (
            mutation.type == "attributes" &&
            mutation.attributeName == "style"
          ) {
            var node = mutation.target;
            if (node == _lockScreen || node == lockCir) pwBypass();

            if (
              node.id == "os-body" ||
              node.id == "os-setup" ||
              node == "os-preload"
            )
              pwBypass();
          }

          if (mutation.type == "childList" && mutation.removedNodes.length) {
            for (var node of mutation.removedNodes) {
              if (!node instanceof HTMLElement) continue;

              if (
                node.id == "os-lockscreen" ||
                node.id == "lockscreenInput" ||
                node.id == "locksmith" ||
                node.id == "WelcomeBackUser"
              )
                pwBypass();
            }
          }
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        subtree: true,
        childList: true,
      });

      window.addEventListener("keyup", async (event) => {
        if (input.value == decodePassword(psw)) {
          input.disabled = true;
          passed = true;
          lockCir.style.border = "4px solid #00ff31";

          await xen.wait(300);
          _lockScreen.style.transition = "1s ease-in-out";
          _lockScreen.style.opacity = 0;

          await xen.wait(1000);

          _lockScreen.style.display = "none";
        } else if (event.key == "Enter") {
          input.disabled = true;

          await xen.wait(1000);

          document.getElementById("lockscreenInput").style =
            "animation:wrongPw .9s cubic-bezier(0.11, 0, 0.5, 0) 0s 1 normal forwards;background: #ff7575b8;";

          await xen.wait(900);

          input.style = "";
          input.disabled = false;
        }
      });
    } else {
      passed = true;
      _lockScreen.style.display = "none";
    }
  });

  xen.fs.writeFile(
    "system.xen",
    `####### System Information (F) ####### \nSystem_Manufacturer: ${xen.platform}; \nIs_InternetConnected: ${navigator.onLine} \nParent_Browser: undefined \n`
  );

  // Proxy
  //await xen.apps.update("Proxies/Aero", undefined, false);

  await xen.apps.update("Xen/Welcome", undefined, false);
  await xen.apps.start();

  xen.platform = await xen.Platform();

  await xen.awaitAll(
    // Preload backgrounds
    xen.settings.init(),

    // Prepare internal apps
    xen.apps.update("Xen/Settings", undefined, false),
    xen.apps.update("Xen/notes", undefined, false),
    xen.apps.update("Xen/Store", undefined, false),
    xen.apps.update("Xen/Testflight", undefined, false),
    xen.apps.update("Kleki/Kleki", undefined, false),
    xen.apps.update("cohenerickson/Velocity", undefined, false)
  );

  // Load dock (Must be after others to ensure first load)
  await xen.dock.loadNative();

  // Welcome the user :)
  await window.xen.apps.launch("Xen/Welcome");

  await xen.wait(1300);

  preloader.style.transition = "1s ease-in-out";
  preloader.style.opacity = 0;
  desk.style.transition = "all .5s ease 0s;";

  await xen.wait(1000);

  preloader.style.display = "none";

  return true;
};
