import { Xen } from "../Xen";

export interface ProcessShared {
    xen?: Xen;
}

export interface Process {
    pid: number;
    process: Worker;
}

export interface Manifest {
    id: string;
    version: string;

    title: string;
    description?: string;
    icon?: string;

    type: 'webview' | 'app' | 'process' | 'library';
    source: string;

    maintainer: {
        name: string;
        email?: string;
        website?: string;
    }

    window?: {
        width?: string;
        height?: string;
        resizable?: boolean;
    };
}