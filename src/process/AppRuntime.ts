import { Proccesses } from "./Processes";
import { AppManifest } from "../global";


export class AppRuntime {
    private processes: Proccesses;

    constructor(processes: Proccesses) {
        this.processes = processes;
    }

    public exec(manifest: AppManifest) {
        if (manifest.type == 'url') {
            const code = `
                await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${manifest.icon}',
                    url: '${manifest.source.url}'     
                });
            `;

            this.processes.spawn(code, true);
        }
    }
}