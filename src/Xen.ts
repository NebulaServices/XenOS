import { LibcurlClient } from "./apis/LibcurlClient";
import { XenFS } from "./apis/files/XenFS";
import { WindowManager } from "./ui/apis/WindowManager";
import { ContextMenu } from "./ui/apis/ContextMenu";
import { TaskBar } from "./ui/components/TaskBar";
import { ProcessManager } from "./apis/Processes";
import { PackageManager } from "./apis/packages/PackageManager";
import { RepoStore } from "./apis/packages/RepoStore";
import { Notifications } from "./ui/apis/Notifications";
import { Wallpaper } from "./ui/Wallpaper";
import { settings } from "./apis/settings";
import { init } from "./core/init";
import { getPolicy, setPolicy } from "./apis/policy/policy";
import { Dialog } from "./ui/apis/Dialog";
import { Systray } from "./ui/apis/Systray";
import { FilePicker } from "./apis/files/FilePicker";
import { sofp, sdp } from "./apis/files/polyfill";
import { updater } from "./core/update";
import { platform } from "./apis/platform";
import { XenShell } from "./apis/shell/XenShell";

export class Xen {
    public settings: typeof settings;
    public fs: XenFS;
    public net: LibcurlClient;
    public wm: WindowManager;
    public process: ProcessManager;
    public packages: PackageManager;
    public repos: RepoStore;
    public contextMenu: ContextMenu;
    public taskBar: TaskBar;
    public notifications: Notifications;
    public wallpaper: Wallpaper;
    public initSystem: typeof init;
    public policy: {
        get: typeof getPolicy,
        set: typeof setPolicy
    }
    public dialog: Dialog;
    public systray: Systray;
    public FilePicker: typeof FilePicker;
    public polyfill: {
        sofp: typeof sofp;
        sdp: typeof sdp;
    }
    public update: typeof updater;
    public platform: typeof platform;
    public shell: typeof XenShell;

    constructor() {
        this.settings = settings;
        this.fs = new XenFS();
        this.net = new LibcurlClient();
        this.wm = new WindowManager();
        this.contextMenu = new ContextMenu();
        this.taskBar = new TaskBar();
        this.notifications = new Notifications();
        this.wallpaper = new Wallpaper();
        this.packages = new PackageManager();
        this.process = new ProcessManager();
        this.repos = new RepoStore();
        this.initSystem = init;
        this.policy = {
            get: getPolicy,
            set: setPolicy
        };
        this.dialog = new Dialog();
        this.systray = new Systray();
        this.FilePicker = FilePicker;
        this.polyfill = {
            sofp: sofp,
            sdp: sdp
        };
        this.update = updater;
        this.platform = platform;
        this.shell = XenShell;
    }

    public version = {
        prefix: 'XenOS',
        codename: 'Nightcord',
        major: 1,
        minor: 2,
        patch: 0,
        channel: 'Canary',
        build: '',
        pretty: ''
    };

    async init() {
        this.version.build += `${(await (await fetch('/uuid')).text()).split('\n')[0]}`;
        this.version.pretty = `${this.version.prefix} ${this.version.codename} v${this.version.major}.${this.version.minor}.${this.version.patch} ${this.version.channel} (${this.version.build})`;
    }
}
