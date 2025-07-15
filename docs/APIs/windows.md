# xen.wm
TODO:
- update
- onClosed
- onCreated
- onFocused

## xen.wm.windows
Returns an array of all window references

## xen.wm.create(opts: WindowOpts): void
This creates a window (see types below)
```ts
interface WindowOpts {
    title: string; // Window title
    width?: string; // Window width
    height?: string; // Window height
    x?: number; // Window X position
    y?: number; // Window Y position
    icon?: string; // Window icon path/URL
    url?: string; // URL for Iframe
    content?: string; // Direct HTML
    resizable?: boolean; // Can window be resized
}
```

## `en.wm.remove(win: Win): void
This removes/deletes a window
```ts
// Example:
window.xen.wm.remove(window.xen.wm.windows[0]);
```

## xen.wm.focus(win: Win): void
Focuses a window