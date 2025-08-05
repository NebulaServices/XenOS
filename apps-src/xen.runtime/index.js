export async function createRuntime(href) {
    const arr = href.split('/');
    const id = arr[6]; // This should be fine?
    const manifest = await parent.xen.packages.getManifest(id);
    let url = "";
    let fsPath = "";
    
    if (manifest.type == 'app') {
        url = location.origin + '/fs/usr/apps/' + id;
        fsPath = '/usr/apps/' + id;
    } else if (manifest.type == 'library') {
        url = location.origin + '/fs/usr/libs/' + id;
        fsPath = '/usr/libs/' + id;
    }

    const runtime = {
        id: id,
        url: url,
        fsPath: fsPath,
        manifest: manifest
    };

    return runtime;
}