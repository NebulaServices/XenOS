# XenOS APIs
Documentation covering (most) of the XenOS APIs
- Notice: some APIs aren't very useful, so they haven't been documented, but they could be useful to you! If you're looking for a niche feature it *probably* exists but you'll after to read some code.

## `xen.FilePicker`
File Picker for XenOS

### `await xen.FilePicker.pick(opts: FilePickerOpts): FilePickerResult`
```ts
interface FilePickerOptions {
    title?: string;
    multiple?: boolean; // Whether to select multiple entries
    mode?: "file" | "directory";
}

interface FilePickerResult {
    path: string | string[]; // Path to file/directory in FS
    stat: any | any[]; // Stat object
    url?: string | string[]; // Blob URL (file only)
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
API for interacting with XenOSes FS based on OPFS

### Types
```ts
interface FileEntryInfo {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
}

interface FileStat {
    name: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    lastModified: Date;
    mime: string | null;
}
```

### `await xen.fs.mkdir(path: string): Promise<void>`
Creates a directory (this is recursive)

### `await xen.fs.list(path: string, recursive: boolean = false): Promise<FileEntryInfo[]>`
Lists the contents of a directory If `recursive` is true it'll list all sub-directories

### `await xen.fs.write(path: string, content: Blob | string | ArrayBuffer): Promise<void>`
Writes `content` to `path`

### `await xen.fs.read(path: string, format: "text" | "arrayBuffer" | "uint8array" | "blob" = "text"): Promise<string | ArrayBuffer | Uint8Array | Blob>`
Reads the contents of `path`. As you may notice there are a few ways to recieve that content...

### `await xen.fs.rm(path: string): Promise<void>`
Removes `path`

### `await xen.fs.exists(path: string): Promise<boolean>`
Checks if `path` exists

### `await xen.fs.pwd(): Promise<string>`
Returns the CWD

### `await xen.fs.cd(path: string): Promise<void>`
Changes the CWD to `path`

### `await xen.fs.fetch(url: string, path: string): Promise<void>`
Fetches `url` and writes response body to `path`

### `await xen.fs.mount(path: string): Promise<void>`
Mounts a native path on your host FS to `path` in XenFS. All files can be read and written.

### `await xen.fs.unmount(path: string): Promise<void>`
Unmounts a mounted path

### `await xen.fs.upload(type: "file" | "directory", path: string): Promise<void>`
Updloads a file or directory to `path` from your host FS

### `await xen.fs.download(path: string): Promise<void>`
Downloads `path` to your host FS

### `await xen.fs.copy(src: string, dest: string): Promise<void>`
Copy and pastes a file or directory. `src` is the thing to copy, `dest` is where to paste (duh).

### `await xen.fs.move(src: string, dest: string): Promise<void>`
moves a file or directory (`src`) to `dest`

### `await xen.fs.stat(path: string): Promise<FileStat>`
Returns the stats of a path

### `await xen.fs.compress(path: string, dest: string): Promise<void>`
Compresses a directory to a ZIP archive

### `await xen.fs.decompress(path: string, dest: string): Promise<void>`
Decompresses a ZIP archive

### `await xen.fs.link(src: string, dest: string): Promise<void>`
Creates a "symlink"

### `await xen.fs.unlink(path: string): Promise<void>`
Removes a symlink

### `await xen.fs.readlink(path: string): Promise<string>`
Reads real path of a symlink

### `await xen.fs.wipe(): Promise<void>`
Recursively deletes the entire XenFS (`/*`)

### `await xen.fs.export(): Promise<void>`
Exports the entire XenFS as a ZIP archive

### `await xen.fs.import(): Promise<void>`
Imports a ZIP archive from your host FS and replaces the current XenFS with the decompressed uploaded ZIP archive

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


### `xen.net.WebSocket`
Behaves the same as `xen.net.direct.libcurl.WebSocket`. Please read libcurl.js's documentation on how to use this!


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
Interact with Wisp servers, using [wisp-client-js](github.com/mercuryworkshop/wisp-client-js). Please read the documentation on the provided GitHub page on how to use this!!

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

### `await xen.packages.anuraInstall(source: 'prompt' | 'opfs' | 'url', path?: string)`
The exact same thing as above expect for Anura packages 

### `await xen.packages.import(id: string)`
Imports all the exported functions, objects, etc. of a library given an ID

### `await xen.packages.remove(id: string, type: 'apps' | 'libs')`
Removes a package given an ID of a certian type

### `await xen.packages.listApps()`
Lists all apps (manifests)

### `await xen.packages.listLibs()`
Lists all libraries (manifests)

### `xen.packages.anuraToXen(manifest: AnuraManifest): XenManifest`
Converts an Anura package's manifest.json file into a Xen package manifest.json
```ts
interface XenManifest {
    id: string;
    version: string;

    title?: string;
    description?: string;
    icon?: string;

    type: 'webview' | 'app' | 'process' | 'library';
    source: string;

    maintainer: {
        name: string;
        email?: string;
        website?: string;
    }

    window?: {
        width?: string;
        height?: string;
        resizable?: boolean;
    };
}

interface AnuraManifest {
    name: string;
    type: 'auto';
    package: string;
    index: string;
    icon: string;
    wininfo: {
        title?: string;
        width?: string;
        height?: string;
        resizable?: boolean;
    };
}

window.xen.packages.anuraToXen(aM: AnuraManifest);
```

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
API for interacting with XenOS repos and Anura repos

### Types
```ts
interface Maintainer {
	name?: string;
	email?: string;
	website?: string;
	repo?: string;
}

interface RepoManifest {
	title: string;
	description: string;
	version: string;
	maintainer?: Maintainer;
	packages: string[];
}

interface PackageManifest {
	name: string;
	description: string;
	type: 'app' | 'lib';
	version: string;
	icon: string;
	maintainer?: Maintainer;
}

interface RepoSettingsStore {
	url: string;
	type: 'xen' | 'anura';
}
```

### `xen.repos.addRepo(url: string, type: 'xen' | 'anura'): void`
Adds a new repo for a given type (url should be the origin)

### `xen.repos.removeRepo(url: string): void`
Removes a repo

### `await xen.repos.getManifest(url: string)`
Gets the `manifest.json` of a repo (This has different return types whether it is a Xen or Anura repo)

### `await xen.repos.listPackages(repo: string, type: 'xen' | 'anura')`
List all packages for a repo. If type is `xen`, it returns all package IDs as an array, if type is `anura`, returns `/list.json` of an Anura repo

### `await xen.repos.getPackage(repo: string, id: string): Promise<PackageManifest>`
This only works on Xen repos!! Returns the package manifest for a given package ID in a repo

### `await xen.repos.install(repo: string, id: string, type: 'xen' | 'anura', anura?: 'id' | 'name'): Promise<void>`
Installs a package given from a repo given an ID.
- Repo: Repo URL origin (duh)
- ID: Package ID (Or optionally the package name for Anura)
- Type: Whether it is a Xen or Anura repo
- Anura: For Anura repos, specify whether to search for package by ID or name


## `xen.settings`
Simple `localStorage` based API but instead automatically handles JSON parsing and stringify
- k = Key
- v = Value
### `xen.settings.get(k: string)`
### `xen.settings.set(k: string, v: any)`
### `xen.settings.remove(k: string)`
### `xen.settings.getAll()`

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

### Window Properties
Each window instance (Ex. `window.xen.wm.windows[0]`) can have their `WindowOpts` read and written