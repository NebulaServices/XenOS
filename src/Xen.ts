import { LibcurlClient } from "./apis/networking/LibcurlClient";
import { XenFS } from "./apis/files/XenFS";
import { oobe } from "./ui/oobe/autoUpdate";
import { WindowManager } from "./ui/windows/WindowManager";
import { ContextMenu } from "./ui/components/ContextMenu";
import { TaskBar } from "./ui/components/TaskBar";
import { Proccesses } from "./apis/process/Processes";
import { PackageManager } from "./apis/packages/PackageManager";
import { RepoStore } from "./apis/packages/RepoStore";
import { Notifications } from "./ui/components/Notifications";
import { Wallpaper } from "./ui/Wallpaper";
import { settings } from "./apis/settings";
import { init } from "./apis/process/init";
import { getPolicy, setPolicy } from "./apis/policy/policy";

export class Xen {
    public settings: typeof settings;
    public fs: XenFS;
    public net: LibcurlClient;
    public boot: typeof oobe;
    public wm: WindowManager;
    public process: Proccesses;
    public packages: PackageManager;
    public repos: RepoStore;
    public ui: {
        contextMenu: ContextMenu,
        taskBar: TaskBar
        notifications: Notifications,
        wallpaper: Wallpaper
    }
    public initSystem: typeof init;
    public policy: {
        get: typeof getPolicy,
        set: typeof setPolicy
    }

    constructor() {
        this.settings = settings;
        this.fs = new XenFS();
        this.net = new LibcurlClient();
        this.boot = oobe;
        this.wm = new WindowManager();
        this.ui = {
            contextMenu: new ContextMenu(),
            taskBar: null as TaskBar,
            notifications: new Notifications(),
            wallpaper: new Wallpaper()
        };
        this.packages = new PackageManager();
        this.process = new Proccesses();
        this.repos = new RepoStore();
        this.initSystem = init;
        this.policy = {
            get: getPolicy,
            set: setPolicy
        }
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
    
        this.ui.taskBar = new TaskBar();
        this.ui.taskBar.init();
        this.ui.taskBar.create();

        this.wm.onCreated = () => this.ui.taskBar.onWindowCreated();
        this.wm.onClosed = () => this.ui.taskBar.onWindowClosed();
    }
}