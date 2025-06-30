import { Xen } from "./Xen";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import * as idbKv from 'idb-keyval';
import * as Comlink from 'comlink';
import * as mime from 'mime';

export interface WindowOpts {
    title: string;
    icon?: string;
    width?: string;
    height?: string;
    x?: number;
    y?: number;
    url: string;
}

interface WriteOpts {
    create?: boolean,
    recursive?: boolean,
}

export interface ContextMenuEntry {
    id: string;
    domain: string;
    title: string;
    funcId: string;
    funcArgs?: any[];
}

export interface FunctionRegistry {
    [funcId: string]: (...args: any[]) => void;
}

export interface PinnedWindowEntry {
    id: string;
    title: string;
    icon?: string;
    url: string;
    order: number;
}

export interface TaskBarEntry {
    itemId: string;
    instanceId: string | null;
    appId: string;
    title: string;
    icon?: string;
    url: string;
    isOpen: boolean;
    isPinned: boolean;
}

export type TaskBarDisplayMode = 'iconOnly' | 'iconAndName';

declare global {
    interface Window {
        xen: Xen;
        idbKv: typeof idbKv;
        Comlink: typeof Comlink;
        BareMux: {
            BareMuxConnection: typeof BareMuxConnection;
        }
        mime: typeof mime;
    }
}

export interface AppManifest {
    title: string;
    packageId: string;
    icon: string;
    type: 'url' | 'app' | 'code'
    source: {
        url?: string;
        view?: string;
        entry?: string
    }
}

export type RegisteredApps = string[];

export interface ProcessShared {
    xen?: Xen;
}

export interface Process {
    pid: number;
    process: Worker;
}
