self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("fetch", event => {
	const req = event.request;

	event.respondWith(
		(async () => {
			const path = new URL(req.url).pathname;

			const cacheResp = await caches.match(path, {
				cacheName: "apps",
			});

      if (path=='/apps/data') {
        return new Response(JSON.stringify((await (await caches.open('apps')).keys()).filter(e=>e.url.endsWith('/manifest.json')).filter(e=>e.url.split('/').length>4).map(e=>e.url.split('/').slice(4, 6)).map(e=>e.join('/'))), {headers: {'content-type': "application/json"}});
      }
        
			if (cacheResp && path.startsWith("/apps/")) {
				var body = await cacheResp.blob();

				// Setup jail
				if (
					cacheResp.headers
						.get("content-type")
						.match(/^(?:text|application)\/javascript/g)
				) {
					body = await body.text();

					return new Response(body, {
						headers: {
							"content-type": getContentType(req.url),
						},
					});
				} else if (
					cacheResp.headers
						.get("content-type")
						.match(/^(?:text)\/html/g)
				) {
					body = await body.text();

					body = `<head><base href="${
						location.origin + path
					}"><script src="/rsc/web/communicator.bundle.js"></script></head>${body}`;

					return new Response(body, {
						headers: {
							"content-type": getContentType(req.url),
						},
					});
				} else if (
					cacheResp.headers
						.get("content-type")
						.match(/^(?:text)\/css/g)
				) {
					return new Response(body, {
						headers: {
							"content-type": getContentType(req.url),
						},
					});
        }

				return new Response(body, {
					headers: {
						...Object.fromEntries(cacheResp.headers),
					},
				});
			} else if (cacheResp && !path.startsWith('/apps/')) {
        //return cacheResp;
      }

      var cache = await caches.open('apps');

      var returnValue = await fetch(event.request);

			try {
			 if (path.startsWith('/rsc/font')) if (req.method=="GET"&&new URL(req.url).protocol.startsWith('http')) await cache.put(req, returnValue);
			} catch (e) {console.log(e)}

			// Offline support
			return await cache.match(req) || returnValue;
		})()
	);
});

// Install
self.addEventListener("message", async event => {
	var { info, file, content } = event.data;

	if (file == info.entry) {
		content = `
var _xen = window.xen;
var _import_xen = _xen.apps.loader;
var { window: BrowserWindow } = _import_xen;

import('/sdk.bundle.js').then(e => {
console.log(e);

  var listeners = []
  var xen = { 
    BrowserWindow,
    on(event, callback) {
      listeners.push([event, callback]);
    },
    emit(event, ...data) {
      listeners.filter(e=>e[0]==event).forEach(e=>e[1](...data));
    },
    quit(force = true) {
      if (force) {
        Object.values(window.xen.windowManager.windows).forEach(win => {
          if (win.el.id==name) win.el.remove();
        });

        window.xen.dock.quit(_name);
      }
    },
    setIcon(url) {
      window.xen.dock.icon(_name, url);
    },
    apps: {
      install(...args) {
        var response = false;
        const flag = name + "_permission_getApps";
        var permCheck = localStorage.getItem(flag);
        console.log(permCheck);
        if (permCheck == null || permCheck == undefined || permCheck == false) {
          const requestMessage = confirm(
            name +
              atob("${btoa(`Wants permission to see which apps are installed. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"`)}")
          );
    
          if (requestMessage == true) {
            console.log("Permission granted");
            localStorage.setItem(flag, "true");
            response = true;
          } else if (requestMessage == false) {
            localStorage.setItem(flag, "false");
            response = false;
          }
        } else if (permCheck === "true") {
          response = true;
        }

        if (response) {
          return window.xen.apps.install(...args);
        } else {
          return new Error('Unauthorized');
        }
      },
      uninstall(...args) {
        var response = false;
        const flag = name + "_permission_getApps";
        var permCheck = localStorage.getItem(flag);
        console.log(permCheck);
        if (permCheck == null || permCheck == undefined || permCheck == false) {
          const requestMessage = confirm(
            name +
              atob("${btoa(`Wants permission to see which apps are installed. \n 'OK' to Grant permissions \n 'cancel' to deny the permission"`)}")
          );
    
          if (requestMessage == true) {
            console.log("Permission granted");
            localStorage.setItem(flag, "true");
            response = true;
          } else if (requestMessage == false) {
            localStorage.setItem(flag, "false");
            response = false;
          }
        } else if (permCheck === "true") {
          response = true;
        }

        if (response) {
          return window.xen.apps.uninstall(...args);
        } else {
          return new Error('Unauthorized');
        }
      },
    }
  };
  
  (async function(xen) {
    xen.BrowserWindow = class BROWIN extends _import_xen.window {
      constructor(...args) {
        super(...args, name, path, xen);
      }
    };
    
    ${await content.text()}
  })(xen);
});
    `;
	}

	const url = `/apps/${info.author}/${info.project}/${file}`;

	caches.open("apps").then(cache => {
		cache.put(
			url,
			new Response(content, {
				headers: {
					"Content-Type": getContentType(file),
					"Content-Length": content.size || content.length,
					"accept-range": "bytes",
					"cache-control": "public, max-age=0",
				},
			})
		);
	});

	// Notify that the file has been installed
	if (event.data.log) event.source.postMessage(url);
});

// Immediately apply updates
self.addEventListener("install", event => self.skipWaiting());

self.addEventListener("activate", event => event.waitUntil(clients.claim()));

function getContentType(file) {
  file = file.split('#')[0].split('?')[0]
	if (file.endsWith(".html")) return "text/html";
	if (file.endsWith(".css")) return "text/css";
	if (file.endsWith(".js")) return "text/javascript";
	if (file.endsWith(".png")) return "image/png";
	// TODO: Add more types
	return "text/plain";
}
