# Library Development Guide
Please read the [App Development Guide](./apps.md) first!

## Developing Libraries
To develop a library, all you need to do is define exports. For example:
```js
export const a = 'b';
export function hi() { alert(1); }
```
Then, you can do this:
```js
const mod = await window.xen.import('package.id');
mod.a; // 'b'
mod.hi();
```