/*
TODO:
- Support `auto` manifest type
- Some how allow apps to access paths at like `./` or `.`
*/

import { Proccesses } from "./Processes";
import { AppManifest } from "../../types/global";

export class AppRuntime {
    private processes: Proccesses;

    constructor(processes: Proccesses) {
        this.processes = processes;
    }

    public async exec(manifest: AppManifest) {
        let code: string;

        if (manifest.type == 'webview') {
            code = `
                const win = await xen.wm.create({
                    title: '${manifest.title}',
                    icon: '${manifest.icon}',
                    url: '${manifest.source.url}'     
                });
            `;
        } else if (manifest.type == 'manual') {
            const encodedUrl = new URL(manifest.source.background, `${location.origin}/fs/apps/${manifest.packageId}/`).href;

            const req = await fetch(encodedUrl);
            const res = await req.text();

            code = res;
        }

        this.processes.spawn(code, true);
    }
}