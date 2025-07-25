# XenOS APIs
Documentation covering (most) of the XenOS APIs
- Notice: some APIs aren't very useful, so they haven't been documented, but they could be useful to you! If you're looking for a nieche feature it *probably* exists but you'll after to read some code.

## `xen.ATL`
The [Anura](https://github.com/mercuryworkshop/anuraos) Translation Layer for XenOS

### `await xen.ATL.package.install`
Same as `xen.packages.install`

### `xen.ATL.repos`
Interacting with Anura marketplaces

#### `xen.ATL.repos.setUrl(url: string)`
Set your marketplace URL

#### `await xen.ATL.repos.listPks();`
List all the packages in the marketplace

#### `await xen.ATL.repos.listApps();`
List all the apps in the marketplace

#### `await xen.ATL.repos.listLibs();`
List all the libraries in the marketplace

#### `await xen.ATL.repos.install(type: 'name' | 'id', inp: string);`
Install a package from the marketplace. Type tells it how to find the package.

## `xen.FilePicker`
File Picker for XenOS

### `await xen.FilePicker.pick(opts: FilePickerOpts): FilePickerResult`
```ts
interface FilePickerOptions {
    title?: string;
    multiple?: boolean; // Whether to select multiple entries
    mode?: "file" | "directory";
}

// Its very confusing..
interface FilePickerResult {
    path: string | string[];
    stat: any | any[];
    content: string | ArrayBuffer | Uint8Array | Blob | (string | ArrayBuffer | Uint8Array | Blob)[];
    url?: string | string[];
    text?: () => Promise<string | string[]>;
    arrayBuffer?: () => Promise<ArrayBuffer | ArrayBuffer[]>;
}

await xen.FilePicker.pick(opts: FilePickerOpts);
```

## `xen.contextMenu`
API for creating context menu's

### `xen.contextMenu.attach(elOrId: string | HTMLElement, options: ContextMenuOptions)`
You can either pass an ID and or element into elOrId, and it'll attatch the context menu to that
```ts
interface ContextMenuEntry {
	title: string;
	icon?: string;
	toggle?: boolean; // Whether the entry is toggelable
	once?: boolean; // Whether the entry isa  "on click" thing
	onClick?: (...args: any[]) => void; // Code to run on click
}

interface ContextMenuOptions {
	[folder: string]: ContextMenuEntry[];
}
```
Context menu's work like this:
```ts
window.xen.contextMenu.attach('test', {
    root: [ // Context menu's can have sub-folders, `root` is the, well, root!
        {
            title: 'Open',
            onClick: () => {
                alert(1);
            }
        }
    ]
});
```

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
The versatile networking client for XenOS

### `await xen.net.fetch(req: url | Request, opts: RequestInit)`
A fetch-like API expect it integrates with:
- [Libcurl.js](github.com/ading2210/libcurl.js)
    - Libcurl.js allows us to route requests through the [Wisp Protocol](github.com/mercuryworkshop/wisp-protocol/), Libcurl.js also bypasses CORS!
- Loopbacks
- Policies
- Request Interceptors

For example:
```ts
await xen.net.fetch('https://localhost'); // Loopback
await xen.net.fetch('https://example.com'); // Any website
```

### `xen.net.direct.libcurl`
This lets you directly access [Libcurl.js](github.com/ading2210/libcurl.js)

### `xen.net.direct.wisp`
This lets you directly acccess [wisp-client-js](github.com/mercuryworkshop/wisp-client-js)

### `xen.net.HTTPSession`
Behaves the same as `xen.net.direct.libcurl.HTTPSession`

### `xen.net.WebSocket`
Behaves the same as `xen.net.direct.libcurl.WebSocket`

### `xen.net.CurlWebSocket`
Behaves the same as `xen.net.direct.libcurl.CurlWebSocket`

### `xen.net.TLSSocket`
Behaves the same as `xen.net.direct.libcurl.TLSSocket`

### `xen.net.onRequest(async (req) => {})`
This lets you intercept requests
```ts
xen.net.onRequest(async (req) => {
    // Here you can modify the request
    console.log(req.url);
    return req;
});
```

### `xen.net.onResponse(async (res) => {})`
This lets you intercept responses
```ts
xen.net.onRequest(async (res) => {
    // Here you can modify the response
    console.log(res.status);
    return req;
});
```

### `xen.net.encodeUrl(url: string)`
This will encode a url into a Ultraviolet encoded URL, or if the URL starts with `location.origin` or `http(s)://localhost`, it wont be

### `xen.net.loopback`
Loopbacks!

#### `await xen.net.loopback.set(port: number, handler: (req: Request) => Promise<Response>)`
This lets you create essentially HTTP servers that run entirely inside of XenOS
```ts
await xen.net.loopback.set(443, async (req) => {
    return new Response('hi!');
});

await (await xen.net.fetch('https://localhost')).text(); // hi!
```

#### `await xen.net.loopback.remove(port: number)`
Removes a loopback

### `xen.net.setUrl(url: string)`
Update the current Wisp URL

### `xen.net.wisp`
Interact with Wisp servers, using [wisp-client-js](github.com/mercuryworkshop/wisp-client-js)

#### `xen.net.wisp.wispConn`
Wisp connection to the current Wisp URL

#### `xen.net.wisp.createStream`
Create a stream using the mentioned above Wisp connection

#### `xen.net.wisp.WebSocket`
WebSocket like API for the Wisp connection

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
API for interacting with packages

### `await xen.packages.getManifest(id: string, type: 'apps' | 'libs')`
Returns the manifest of a package given an ID and type

### `await xen.packages.open(id: string)`
Opens an app given an id

### `await xen.packages.install(source: 'prompt' | 'opfs' | 'url', path?: string)`
If `source` is prompt, it'll ask you to select a zip archive using the native file picker, if its `url`, put the url to the zip archive, if its `opfs`, put the path in XenFS. This will, well, install a package!

### `await xen.packages.import(id: string)`
Imports all the exported functions, objects, etc. of a library given an ID

### `await xen.packages.remove(id: string, type: 'apps' | 'libs')`
Removes a package given an ID of a certian type

### `await xen.packages.listApps()`
Lists all apps (manifests)

### `await xen.packages.listLibs()`
Lists all libraries (manifests)

## `xen.policy`
API for interacting with XenOS policies. All policies are stored in `/usr/policies` and policy groups are stored in `/usr/policies/POLICY_TYPE/GROUP_NAME.json`

### Types
```ts
export interface NetworkPolicy {
    ports: {
        allowed: number[] | "*";
        denied: number[] | "*";
    }

    ips: { // IPv4
        allowed: string[] | "*";
        denied: string[] | "*";
    }

    domains: {
        allowed: (string | RegExp)[] | "*";
        denied: (string | RegExp)[] | "*";
    };

    denyHTTP: boolean // Deny requests with protocol `http`
}

export interface PackagePolicy {
    allowed: string[] | "*";
    denied: string[] | "*";
    forceInstalled: string[];
}

export interface RepoPolicy { // Repo URLs
    allowed: string[] | "*";
    denied: string[] | "*";
}
```

### `await xen.policy.get(type: 'network' | 'repo' | 'package')`
Returns the combined policy of all "policy groups" for a type

### `await xen.policy.set(type: 'network' | 'repo' | 'package', name: string, content: NetworkPolicy | PackagePolicy | RepoPolicy)`
```ts
await xen.policy.set('network', 'custom.json', { // Policy type and group name
    domains: {
        denied: ['https://example.com']
    }
});
```

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
API for interfacing with the wallpaper. All wallpapers are stored in `/usr/wallpapers` in the FS

### `await xen.wallpaper.get()`
Returns path of the wallpaper

### `await xen.wallpaper.upload(type: 'url' | 'prompt', url?: string)`
If `type` is prompt, it'll ask you to pick a wallpaper using the native file picker, if its `url`, then you provide a `url` and it'll download it

### `await xen.wallpaper.set(file: string)`
Sets the wallpaper

### `await xen.wallpaper.remove(file: string)`
Removes a wallpaper

### `await xen.wallpaper.list()`
Lists all wallpapers

### `await xen.wallpaper.default()`
Sets the default wallpaper

## `xen.wm`
API for creating windows

### `xen.wm.windows`
Returns an array of all currently open windows, each item in the array is a reference to a window

### `xen.wm.create(opts: WindowOpts)`
```ts
interface WindowOpts {
    title?: string; 
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