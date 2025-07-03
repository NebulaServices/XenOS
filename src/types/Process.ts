import { Xen } from "../Xen";

export interface ProcessShared {
    xen?: Xen;
}

export interface Process {
    pid: number;
    process: Worker;
}
