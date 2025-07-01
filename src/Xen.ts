import { LibcurlClient } from "./apis/networking/LibcurlClient";
import { XenFS } from "./apis/files/XenFS";
import { oobe } from "./oobe/autoUpdate";
import { WindowManager } from "./ui/windows/WindowManager";
import { ContextMenu } from "./ui/ContextMenu";
import { TaskBar } from "./ui/TaskBar";
import { Proccesses } from "./apis/process/Processes";
import { AppManager } from "./apis/process/Apps";

export class Xen {
    public net: LibcurlClient;
    public fs: XenFS;
    public boot: typeof oobe;
    public wm: WindowManager;
    public process: Proccesses;
    public apps: AppManager;
    public ui: {
        contextMenu: ContextMenu,
        taskBar: TaskBar
    };

    constructor() {
        this.net = new LibcurlClient((location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/");
        this.fs = new XenFS(this.net);
        this.boot = oobe;
        this.wm = new WindowManager();
        this.ui = {
            contextMenu: new ContextMenu(),
            taskBar: null as TaskBar
        };
        this.process = new Proccesses(this);
        this.apps = new AppManager(this.fs, this.process);
    }

    public version = {
        prefix: 'XEN',
        codename: 'Q',
        major: 0,
        minor: 0,
        patch: 0,
        build: '',
        pretty: ''
    };

    async init() {
        this.version.build += `${(await (await fetch('/uuid')).text()).split('\n')[0]}`;
        this.version.pretty = `${this.version.prefix}-${this.version.codename} v${this.version.major}.${this.version.minor}.${this.version.patch} (${this.version.build})`;
    
        this.ui.taskBar = new TaskBar(this.wm, this.ui.contextMenu);
        this.ui.taskBar.create();

        this.wm.onCreated = () => this.ui.taskBar.onWindowCreated();
        this.wm.onClosed = () => this.ui.taskBar.onWindowClosed();
        this.wm.onFocused = (win) => this.ui.taskBar.onWindowFocused(win);
    }
}