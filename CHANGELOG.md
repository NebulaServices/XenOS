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