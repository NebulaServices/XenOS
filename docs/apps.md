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
All packages can utilize XenOS APIs, however, if you are developing an app, your script should follow this logic:
```js
document.addEventListener('DOMContentLoaded', () => {
    function main() {
      // code here
    }

    setTimeout(() => { 
        main()
    }, 100);
});
```
This gives a bit of time for Xen to inject its APIs into your app, which is needed, since without this setTimeout, uses `xen` or `window.xen` will result in `undefined`

## App Examples
For example applications, please see the `apps-src` directory