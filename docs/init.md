# Init System

## Init Scripts
You can create script files in `/usr/init` and each one will be ran on system startup.

## Startup Apps
You can make an app run on start-up by pushing the package id to the settings value `startup`

For example:
```js
const su = window.xen.settings.get('startup');
su.push('org.nebulaservices.about');
window.xen.settings.set('startup', su);
location.reload(); // The about up will now open on startup
```