import { LibcurlClient } from "./apis/networking/LibcurlClient";
import { XenFS } from "./apis/files/XenFS";
import { oobe } from "./ui/oobe/autoUpdate";
import { WindowManager } from "./ui/windows/WindowManager";
import { ContextMenu } from "./ui/apis/ContextMenu";
import { TaskBar } from "./ui/components/TaskBar";
import { Proccesses } from "./apis/process/Processes";
import { PackageManager } from "./apis/packages/PackageManager";
import { RepoStore } from "./apis/packages/RepoStore";
import { Notifications } from "./ui/apis/Notifications";
import { Wallpaper } from "./ui/Wallpaper";
import { settings } from "./apis/settings";
import { init } from "./apis/process/init";
import { getPolicy, setPolicy } from "./apis/policy/policy";
import { Dialog } from "./ui/apis/Dialog";
import { Systray } from "./ui/apis/Systray";
import { AnuraPackages } from "./apis/packages/anura/Packages";
import { AnuraRepos } from "./apis/packages/anura/Repos";
import { FilePicker } from "./apis/files/FilePicker";

export class Xen {
    public settings: typeof settings;
    public fs: XenFS;
    public net: LibcurlClient;
    public boot: typeof oobe;
    public wm: WindowManager;
    public process: Proccesses;
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
    public ATL: {
        package: AnuraPackages;
        repo: AnuraRepos;
    }
    public FilePicker: typeof FilePicker;

    constructor() {
        this.settings = settings;
        this.fs = new XenFS();
        this.net = new LibcurlClient();
        this.boot = oobe;
        this.wm = new WindowManager();
        this.contextMenu = new ContextMenu();
        this.taskBar = null as TaskBar;
        this.notifications = new Notifications();
        this.wallpaper = new Wallpaper();
        this.packages = new PackageManager();
        this.process = new Proccesses();
        this.repos = new RepoStore();
        this.initSystem = init;
        this.policy = {
            get: getPolicy,
            set: setPolicy
        };
        this.dialog = new Dialog();
        this.systray = new Systray();
        this.ATL = {
            package: new AnuraPackages(),
            repo: new AnuraRepos()
        };
        this.FilePicker = FilePicker;
    }

    public version = {
        prefix: 'XenOS',
        codename: 'Nightcord',
        major: 1,
        minor: 0,
        patch: 0,
        build: '',
        pretty: ''
    };

    async init() {
        this.version.build += `${(await (await fetch('/uuid')).text()).split('\n')[0]}`;
        this.version.pretty = `${this.version.prefix} ${this.version.codename} v${this.version.major}.${this.version.minor}.${this.version.patch} (${this.version.build})`;

        this.taskBar = new TaskBar();
        this.taskBar.init();
        this.taskBar.create();

        this.wm.onCreated = () => this.taskBar.onWindowCreated();
        this.wm.onClosed = () => this.taskBar.onWindowClosed();

        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        if (await this.fs.exists('/temp')) {
            await this.fs.rm('/temp');
        }
    }
}