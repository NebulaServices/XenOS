import { LibcurlClient } from "./apis/LibcurlClient";
import { VFSManager } from "./apis/files/VFS/VFSManager";
import { VFS } from "./apis/files/VFS/VFS";
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
import { FilePicker } from "./ui/apis/FilePicker";
import { sofp, sdp } from "./apis/files/polyfill";
import { updater } from "./core/update";
import { platform } from "./apis/platform";
import { XenShell } from "./apis/shell/XenShell";

export class Xen {
    public settings: typeof settings = settings;
    public vfs: VFSManager = new VFSManager();
    public fs: VFS = this.vfs.vfs;
    public VFS: typeof VFS = VFS;
    public net: LibcurlClient = new LibcurlClient();
    public wm: WindowManager = new WindowManager();
    public process: ProcessManager = new ProcessManager();
    public packages: PackageManager = new PackageManager();
    public repos: RepoStore = new RepoStore();
    public contextMenu: ContextMenu = new ContextMenu();
    public taskBar: TaskBar = new TaskBar();
    public notifications: Notifications = new Notifications();
    public wallpaper: Wallpaper = new Wallpaper();;
    public initSystem: typeof init = init;
    public policy: {
        get: typeof getPolicy,
        set: typeof setPolicy
    }
    public dialog: Dialog = new Dialog();
    public systray: Systray = new Systray();
    public FilePicker: typeof FilePicker = FilePicker;
    public polyfill: {
        sofp: typeof sofp;
        sdp: typeof sdp;
    }
    public update: typeof updater = updater;
    public platform: typeof platform = platform;
    public shell: typeof XenShell = XenShell;

    constructor() {
        this.policy = {
            get: getPolicy,
            set: setPolicy
        };
        this.polyfill = {
            sofp: sofp,
            sdp: sdp
        };
    }

    public version = {
        prefix: 'XenOS',
        codename: 'Nightcord',
        major: 1,
        minor: 2,
        patch: 0,
        channel: 'Stable',
        build: '',
        pretty: ''
    };

    async init() {
        this.version.build += `${(await (await fetch('/uuid')).text()).split('\n')[0]}`;
        this.version.pretty = `${this.version.prefix} ${this.version.codename} v${this.version.major}.${this.version.minor}.${this.version.patch} ${this.version.channel} (${this.version.build})`;
    }
}
