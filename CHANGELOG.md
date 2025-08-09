# Changelog 
## `v1.0.0`
XenOS release!

## `v1.0.1`
Multiple bugs fixed

## `v1.1.0`
WebDAV support in the SW (This may seem like a small thing but in reality its massive, VSCode support for example)

### `v1.1.1`
Processes have greatly improved:
- API is the same
- Each process is assigned a PID
- Processes can be terminated (apps/webviews processes should be automatically terminated apon the window closing; this needs to be studied as it could maybe cause bugs, unsure yet)
- You can also retrieve information about processes
    - Status
    - Start time
    - PID
    - Memory usage
- Apps can now access `parent.xen` for immediate access to the global without having to wait for `window.xen` to be loaded 

## `v1.1.2`
- Removed the runtime global for apps, please check docs for more info
- Improved termination of processes
- Add a process manager app
- Clicking on an already focused entry on the taskbar will minimize it
- Fullscreen state will persist across minimizations

## `v1.1.3`
- Scoped KV
- Removed un-needed options in LibcurlClient
- Apps now use said scoped KV

## `v1.1.4`
- Reseting an instance will now delete all:
    - Cookies
    - localStorage values
    - sessionStorage values
    - iDBs
- Double clicking a zip archive will now unzip it and navigate to the unzipped archive
- You can no longer delete core applications (all apps that are pre-installed or have `org.nebulaservices.*`)

## `v1.1.5`
- SW was re-written (No more Workbox)
- Theres no caching, this allows the site to:
    - Work offline
    - Bypass web-filters (if you have the PWA installed, I think)
- The site will no longer auto update on boot, instead, you have to manually update by pressing the "check for updates" button in the settings app

## `v1.1.6`
- Mobile support!
    - You can drag, resize, and clamp windows on mobile devices. This works best on tablets but you could do it on your phone if you really wanted too
    - New platform API for getting information about the current platform

## `v1.1.7`
XenOS now boostraps the FS.
- What does this mean?
    - You get all the benefits of caching (offline usage), but now, you can edit the sites content! Everything is stored on the FS

## `v1.1.8`
- XenOS now has a UNIX-like shell and terminal app!
    - For more info check docs