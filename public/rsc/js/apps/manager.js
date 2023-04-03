const path = require('path-browserify');
const mime = require('mime');

module.exports = {
  async send(meta, file, content) {
    return await xen.apps.forceInstall(meta.id.split('/')[0], meta.id.split('/')[1], file, content, meta.entry, true);
  },

  async cache(app) {
    const meta = (await (await fetch('https://xenos-app-repository.enderkingj.repl.co/meta')).text()).split('\n').map(e => e.split('=')).find(([key]) => key === app)[1].replace('packages/Xen', 'native');

    const resource = require(`../apps/${meta}/manifest.json`);
    resource.id = app;

    const basePath = `../apps/${meta}`;

    for (const file of resource.assets) {
      console.log(file);
      try {
        const filePath = path.join(basePath, file);
        const fileContent = require(`!!raw-loader!${filePath}?raw`).default;
        const fileType = mime.getType(file);

        if (file === 'manifest.json') {
          fileContent.id = app;
        }

        const content = fileContent.toString().startsWith(location.origin + '/rsc/web/') ? await (await fetch(fileContent)).blob() : new Blob([fileContent], { type: fileType });

        await this.send(resource, file, content);
      } catch (error) {
        console.log(error);
      }
    }
  }
};
