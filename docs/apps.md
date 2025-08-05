# App Development
The app development guide for XenOS

## The Manifest Format
Every package should have a `manifest.json` file at the root of the package directory and follow this schema:
```ts
interface Manifest {
    id: string; // Package ID, this should follow the reverse domain notation (Ex. org.nebulaservices.about)
    version: string; // Version should follow the semantic version schema

    title: string; // Name of your package
    description?: string;
    icon: string; // Path to the icon

    type: 'webview' | 'app' | 'process' | 'library';
    /*
        webview:
            - Self explanitory (?)
            - For `source` just give a URL
        app: 
            - An application
            - For `source` give a path to your main HTML file (Ex. `index.html`)
        process:
            - When you run this it won't open a window, but rather just execute code
            - For `source` it's similar to `app` just a JS file instead
        library:
            - These are for libraries, please see `libs.md` for more information
            - Fource source same as `process`
    */
    source: string; // See above

    maintainer?: { // Optinal information about you (the developer!)
        name?: string;
        email?: string;
        website?: string;
    }

    window?: { // Optional customizability about the window
        width?: string;
        height?: string;
        resizable?: boolean;
        xenFilePicker?: boolean; // If true, replaces the default file picker with one for XenOS, letting you pick files from XenOS instead of your PC
    };

    installHook?: string; // Optionally, you can specify a path (Ex. `hook.js`) and it will be run on install
}
```

## Directory Format
All packages should follow this format:
```
directory/
    - manifest.json
    - <other files>
```
Xen will install packages given a `zip` archive, so you'll want to zip your package before installing it
- Notice: MAKE SURE YOU ZIP THE FILES NOT THE DIRECTORY!! The files need to be at the root of the zip archive

## APIs
All packages can utilize XenOS APIs, you can access them at `parent.xen`

## App Arguments
You can parse URL Paramaters as app arguments. To learn more about this checkout the [API Docs](./API.md) and you can see an example in the text editor app.

## App Runtimes
There is a default library included in XenOS you can use to retrieve information about the current app or library, you can use it by doing:
```js
const lib = await parent.xen.packages.import('xen.runtime');
const rt = await lib.createRuntime(location.href);
window.runtime = rt;
```

### `window.runtime.fsPath`
Gives the packages FS path (Ex. `/usr/apps/org.nebulaservices.about`)

### `winow.runtime.id`
Gives the packages ID (Ex. `org.nebulaservices.about`)

### `window.runtime.url`
Gives the packages URL (Ex. `http://localhost:3000/fs/usr/apps/org.nebulaservices.about`)

### `window.runtime.manifest`
Returns the packages manifest

## Scoped KV
The `xen.KV` class lets apps/libs use their own scoped KV storage. It has the exact same API as `xen.settings`
```js
const kv = new parent.xen.KV(location.href); // REQUIRED
await kv.set('a', 'b');
await kv.get('a'); // 'b'

await kv.set('b', { a: 'json' });
await kv.get('b'); // {a: 'json'}
```

## App Examples
For example applications, please see the `apps-src` directory (The code is terrible, you have been warned)