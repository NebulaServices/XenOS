self.addEventListener("activate", () => self.clients.claim());

self.addEventListener("fetch", event => {
	const req = event.request;

	event.respondWith(
		(async () => {
			const path = new URL(req.url).pathname;

			const cacheResp = await caches.match(path, {
				cacheName: "apps",
			});

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
					}"><script src="/rsc/web/webcommunicator.js"></head></script>${body}`;

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
			}

			try {
				returnValue = await fetch(event.request);

				//if (req.method=="GET"&&new URL(req.url).protocol.startsWith('http')) (await caches.open('apps')).put(req, returnValue);
			} catch (e) {}

			// Offline support
			return returnValue;
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
// e is undefined no output from module
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
          win.el.remove();
        });

        window.xen.dock.quit(_name);
      }
    },
    setIcon(url) {
      window.xen.dock.icon(_name, url);
    },
  };
  
  (function(xen) {
    xen.BrowserWindow = class BROWIN extends _import_xen.window {
      constructor(...args) {
        super(...args, name, path, xen);
      }
    }
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
	if (file.endsWith(".html")) return "text/html";
	if (file.endsWith(".css")) return "text/css";
	if (file.endsWith(".js")) return "application/javascript";
	if (file.endsWith(".png")) return "image/png";
	// TODO: Add more types
	return "text/plain";
}
