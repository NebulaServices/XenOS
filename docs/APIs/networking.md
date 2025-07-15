# xen.net

## xen.net.direct

### xen.net.direct.libcurl
Lets you directly interface with Libcurl.js

### xen.net.direct.wisp
Lets you directly interface with wisp-client-js

## xen.net.loopback
TODO
### xen.net.loopback.call
### xen.net.loopback.remove
### xen.net.loopback.set

## xen.net.fetch(url: string, opts?: RequestInit): Response
Fetchs and returns URL. Is integrated with loopbacks and all requests are routed through UV

## xen.net.WebSocket
## xen.net.CurlWebSocket
## xen.net.TLSSocket
## xen.net.HTTPSession
All of these methods are just references to `xen.net.direct.libcurl.`

## xen.net.setUrl(url: string): void
Updates Wisp URL

## xen.net.encodeUrl(url: string): string
Encodes a standard URL to a UV encoded URL