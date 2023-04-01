import fs from "./fs";
import proxy from "./proxy";
import open from "./open";
import widget from "./widget";
import modal from "./fs";
// Internal
import apps from "./apps";

const SDK = {
  fs: fs,
  proxy: proxy,
  open: open,
  widget: widget,
  model: modal,
  apps: apps,
};

//window.__XEN_BUNDLE_SDK = SDK;

export default SDK;
