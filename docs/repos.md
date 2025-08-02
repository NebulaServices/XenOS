# XenOS Repositories
XenOS Repo's follow this file structure:
```
manifest.json
packages/
    ${ID}/
        manifest.json
        package.zip
```

## Repo `manifest.json`
```json
{
  "title": "Repo Title",
  "description": "Repo Description",
  "version": "x.x.x",
  "packages": [
    "array.of.all.packages.ids.in.repo"
  ]
}
```

## Package `manifest.json`
```json
{
  "name": "Package name",
  "description": "Package description",
  "type": "Package type (app or lib)",
  "version": "x.x.x",
  "icon": "logo.png"
}
```

## How does this work?
The `manifest.json` at the root of the file structure gives information to the client about the repo itself, the `manifest.json` file per package tells the client information about the package. This is seperate from a packages `manifest.json`.

## Note
Repo's can be nested URLs. For example you could have:
```
https://repos.xen-os.dev/apps/
https://repos.xen-os.dev/web/apps/
```

## Examples
You can find example's of XenOS Repos at:
- https://repos.xen-os.dev
- https://xen-repos.scaratek.dev