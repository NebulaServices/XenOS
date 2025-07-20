import { Xen } from "./Xen";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import * as idbKv from 'idb-keyval';
import * as Comlink from 'comlink';
import * as mime from 'mime';
import * as jszip from 'jszip';

declare global {
    interface Window {
        xen: Xen;
        modules: {
            idbKv: typeof idbKv;
            Comlink: typeof Comlink;
            mime: typeof mime;
            jszip: typeof jszip;
        }
        BareMux: {
            BareMuxConnection: typeof BareMuxConnection;
        }
        JSZip: jszip;
        shared: {
            xen?: Xen;
            mime?: any;
        }
    }
}