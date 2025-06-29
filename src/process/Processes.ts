import { Xen } from "../Xen";

interface Shared {
    xen?: Xen;
}

interface Process {
    pid: number;
    process: Worker;
}

export class Proccesses {
    private npid = 0;
    public processes: Process[] = [];
    public shared: Shared;

    constructor(xen: Xen) {
        this.shared = {
            xen: window.Comlink.proxy(xen) as unknown as Xen,
        };
    }

    public spawn(code: string, isAsync = false) {
        const prefix = isAsync ? "async" : "";
        const comlinkUrl = new URL(
            "/libs/comlink/umd/comlink.min.js",
            window.location.origin,
        ).href;

        const template = `
        importScripts('${comlinkUrl}');

        let xen;

        addEventListener('message', async (ev) => {
            if (ev.data?.target == 'comlink-init') {
                self.shared = Comlink.wrap(ev.data.value);
                xen = self.shared.xen;

                (
                    ${prefix}() => {
                        ${code}
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

        window.Comlink.expose(this.shared, port1);
        worker.postMessage(msg, [port2]);
    }

    public kill(pid: number) { this.processes[pid].process.terminate(); }
}