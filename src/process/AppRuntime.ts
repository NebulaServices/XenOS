import { Proccesses } from "./Processes";
import { AppManifest } from "../global";


export class AppRuntime {
    private processes: Proccesses;

    constructor(processes: Proccesses) {
        this.processes = processes;
    }

    public async exec(manifest: AppManifest) {
        let code: string;

        if (manifest.type == 'url') {
            code = `
                await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${manifest.icon}',
                    url: '${manifest.source.url}'     
                });
            `;
        } else if (manifest.type == 'code') {
            const encodedUrl = new URL(manifest.source.entry, `${location.origin}/fs/apps/${manifest.packageId}/`).href;

            const req = await fetch(encodedUrl);
            const res = await req.text();
            
            code = res;
        }

        this.processes.spawn(code, true);
    }
}