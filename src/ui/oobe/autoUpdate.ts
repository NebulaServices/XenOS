//import { mirrorFS } from "./mirror";

export async function oobe() {
    if (!localStorage.getItem('xen.fs.mirrored')) {
        //console.log('[oobe] init oobe')
        //await mirrorFS();
        //console.log('[oobe] update finished');
        localStorage.setItem('xen.fs.mirrored', 'true');
    }

    if (!localStorage.getItem('xen.cache.build')) {
        //console.log('[oobe] set init cache build')
        localStorage.setItem('xen.cache.build', window.xen.version.build);
    }

    if (window.xen.version.build != localStorage.getItem('xen.cache.build')) {
        //console.log('[oobe] update deps');
        //await mirrorFS();
        //console.log('[oobe] update finished');
        localStorage.setItem('xen.cache.build', window.xen.version.build);
    }
}