const path = require('path-browserify');
const mime = require('mime');

module.exports = {
  send(meta, file, content) {
  
  },
  
  async cache(app) {
    const meta = (await (await fetch('https://xenos-app-repository.enderkingj.repl.co/meta')).text()).split('\n').map(e=>e.split('=')).find(e=>e[0]==app)[1].replace('packages/Xen', 'native');

    const resource = require(`../apps/${meta}/manifest.json`);

    resource.id = app;
    var promises = [];

    for (var file of resource.assets) {
      promises.push(new Promise(async resolve => {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg') || file.endsWith('.gif') || file.endsWith('.jpeg')) var mod = require(`!!file-loader!../apps/`+path.join(`${meta}`, file)+'?raw').default;
        else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.wasm')) var mod = require(`!!raw-loader!../apps/`+path.join(`${meta}`, file)+'?raw').default;
        else var mod = require('../apps/'+path.join(`${meta}`, file)+'?raw');
  
        
  
        if (mod.toString().startsWith(location.origin+'/rsc/web/')) {
          mod = await (await fetch(mod)).blob();
        }
        
        await this.send(resource, file, mod instanceof Blob ? mod : new Blob([mod], {type: mime.getType(file)}));
      }));
    }

    await xen.awaitAll(...promises);

    return;
  }
}