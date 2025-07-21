import { Xen } from "./Xen";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import * as Comlink from 'comlink';

declare global {
    interface Window {
        xen: Xen;
        modules: {
            Comlink: typeof Comlink;
        }
        BareMux: {
            BareMuxConnection: typeof BareMuxConnection;
        }
        shared: {
            xen?: Xen;
        }
    }
}

export interface Shared {
    xen?: Xen;
}