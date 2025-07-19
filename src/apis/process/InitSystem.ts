import { Proccesses } from "./Processes";
import { XenFS } from "../files/XenFS";

export class InitSystem {
    private process: Proccesses;
    private fs: XenFS

    public async execute() {
        this.fs = window.xen.fs;
        this.process = window.xen.process;

        const scripts = await this.fs.list('/init');

        scripts.forEach(async (el) => {
            if (el.isFile == true) {
                const script = await this.fs.read(`/init/${el.name}`, 'text');
                this.process.spawn((script as string), true);
            }
        });
    }
}