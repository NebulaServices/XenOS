import { Xen } from "../../Xen";
import { Process, ProcessShared, ProcessOpts } from "../../types/Process";

export class Proccesses {
    private npid = 0;
    public processes: Process[] = [];

     public async spawn(opts: ProcessOpts) {
        const prefix = opts.async ? "async" : "";
        const comlinkUrl = new URL("/libs/comlink/umd/comlink.min.js", window.location.origin).href;
        let content: string | Promise<string>;

        if (opts.type == 'direct') {
            content = opts.content;
        } else if (opts.type == 'url') {
            content = (await fetch(window.xen.net.encodeUrl(opts.content))).text();
        } else if (opts.type == 'opfs') {
            content = (await window.xen.fs.read(opts.content, 'text') as string);
        }

        const template = `
        importScripts('${comlinkUrl}');

        let xen;

        addEventListener('message', async (ev) => {
            if (ev.data?.target == 'comlink-init') {
                self.shared = Comlink.wrap(ev.data.value);
                xen = self.shared.xen;

                (
                    ${prefix}() => {
                        ${content}
                    }
                )();
            }
        });
        `;
        const blob = new Blob([template], { type: "application/javascript" });
        const urlObj = URL.createObjectURL(blob);
        const worker = new Worker(urlObj);
        const process: Process = {
            pid: this.npid,
            process: worker,
        };

        this.processes[this.npid] = process;
        this.npid++;

        const { port1, port2 } = new MessageChannel();
        const msg = {
            target: "comlink-init",
            value: port2,
        };
        const shared: ProcessShared = {
            xen: window.modules.Comlink.proxy(window.xen) as unknown as Xen,
        };

        window.modules.Comlink.expose(shared, port1);
        worker.postMessage(msg, [port2]);
    }

    public kill(pid: number) { this.processes[pid].process.terminate(); }
}