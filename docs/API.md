# XenOS APIs
Documentation covering (most) of the XenOS APIs
- Notice: some APIs aren't very useful, so they haven't been documented, but they could be useful to you! If you're looking for a nieche feature it *probably* exists but you'll after to read some code.

## `xen.contextMenu`
TODO SCARY

## `xen.dialog`
API for creating dialog windows

### Types
```ts
interface DialogOptions {
    title?: string; // <h1>
    body?: string; // <p>
    icon?: string;
    placeholder?: string; // Placeholder text in textfield
}
```

### `await xen.dialog.alert(opts: DialogOpts)`
Basic alert dialog

### `await xen.dialog.confirm(opts: DialogOpts)`
Confirmation dialog, will either return true or false
```ts
await xen.dialog.confirm({ 
    title: 'asdasd', 
    body: 'aasd' 
}).then(async res => console.log(res)); // True or false
```

### `await xen.dialog.prompt(opts: DialogOpts)`
Prompt dialog, user can input text
```ts
await xen.dialog.prompt({ 
    title: 'asdasd', 
    body: 'aasd' 
}).then(async res => console.log(res)); // Whatever the user typed in
```

## `xen.fs`
TODO AAA

## `xen.net`
TODO Too many features,,.

## `xen.notifications`
API for creating notifications

### `xen.notifications.spawn(opts: NotificationOpts)`
```ts
interface NotificationOpts {
    title: string;
    description: string; // Body content
    icon?: string;
    image?: string | ArrayBuffer;
    timeout?: number; // Time before notification disappears
    onClick?: () => void; // Code that will run when the notification is clicked on (duh)
}

xen.notifications.spawn(opts: NotificationOpts)`
```

## `xen.packages`
TODO I dont feel like it rn ngl

## `xen.policy`
TODO I also dont feel like it

## `xen.process`
API for managing processes
- Notice: currently processes are like literally just `eval` because I can't figure out a better way to do them as of now D:

### `await xen.process.spawn(opts: ProcessOpts)`
```ts
interface ProcessOpts {
    async?: boolean; // Whether your code should be ran asynchronously
    type: 'direct' | 'url' | 'opfs'; // Direct = string (of your code) | URL = duh | opfs = path in FS
    content: string; // Either your code, a URL, or a path
}

await xen.process.spawn(opts: ProcessOpts);
```

## `xen.repos`
API for interacting with XenOS Package Repositories. To learn more about repos, please checkout the [XenOS Repository Documentation](./repos.md)
- Notice: these method names will *probably* change

### `await xen.repos.updateServer(url: string)`
Sets the current repo URL

### `await xen.repos.monoManifest()`
Returns the monorepo manifest

### `await xen.repos.repoManifest(repo: string)`
Returns the manifest for a given repo

### `await xen.repos.pkgManifest(repo: string, id: string)`
Returns a packages manifest given a repo and package ID

### `await xen.repos.install(repo: string, id: string)`
Installs a package using the ID from a given repo

## `xen.settings`
API for interacting with XenOS settings, it has the same API as `localStorage`, expect you can set any type of data, not just strings. It is recommended to use JSON.

## `xen.systray`
API for interacting with systray's

### `xen.systray.register(opts: SystrayOpts)`
```ts
interface SystrayOpts {
	id: string;
	icon: string;
	tooltip?: string;
	onLeftClick?: (ev: MouseEvent) => void;
	onRightClick?: (ev: MouseEvent) => void;
}

xen.systray.register(opts: SystrayOpts);
```

### `xen.systray.unregister(id: string)`
Allows you to remove a systray given an ID

## `xen.wallpaper`
API for interfacing with the wallpaper

### `await xen.wallpaper.get()`
Returns path of the wallpaper

### `await xen.wallpaper.set(path?: string, type: 'url' | 'opfs' = 'url')`
`type` allows you to specify whether the wallpaper is located inside of the XenFS, or is a URL. Path is optional as if no path provided it will set to the default wallpaper

### `await xen.wallpaper.remove()`
Sets wallpaper to the default one

## `xen.wm`
API for creating windows

### `xen.wm.windows`
Returns an array of all currently open windows, each item in the array is a reference to a window

### `xen.wm.create(opts: WindowOpts)`
```ts
interface WindowOpts {
    title: string; 
    width?: string;
    height?: string;
    x?: number;
    y?: number;
    icon?: string; // Path of icon
    url?: string; // Url you want the window to display
    content?: string; // Raw HTML set using `innerHTML` (SCRIPT TAGS WONT WORK!!)
    resizable?: boolean; // Disables resizing, fullscreening, and clamping
    display?: boolean; // Whether the window should be visible. This allows for offscreen documents.
    borderless?: boolean; // Allows developers to implement there own window shell
}

xen.wm.create(opts: WindowOpts);
```