import { Xen } from "../Xen";

export interface ProcessShared {
    xen?: Xen;
}

export interface Process {
    pid: number;
    process: Worker;
}

export interface AppManifest {
    title: string;
    packageId: string;
    icon: string;
    type: 'webview' | 'auto' | 'manual'
    source: {
        url?: string;
        index?: string;
        background?: string;
    };
    window?: {
        width?: string;
        height?: string;
    };
}

export type RegisteredApps = string[];