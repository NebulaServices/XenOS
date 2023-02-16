import fs from "./fs.ts";
import proxy from "./proxy.ts";
import open from "./open.ts";
import widget from "./widget.ts";
import modal from "./fs.ts";
// Internal
import apps from "./apps.ts";

const SDK = {
    fs: fs,
    proxy: proxy,
    open: open,
    widget: widget,
    model: modal,
    apps:  apps,
};

window.__XEN_BUNDLE_SDK = SDK;

export default SDK;