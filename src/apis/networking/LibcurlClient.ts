import { RequestInterceptor, ResponseInterceptor, NetworkSettings, defaultSettings } from "./types";
import { networkHandler } from "../policy/handler";

export class LibcurlClient {
    public loopback = {
        resolver: {} as Record<number, (req: Request) => Promise<Response> | Response>,

        call: async (port: number, req: Request): Promise<Response> => {
            const handler = this.loopback.resolver[port];

            if (!handler) {
                throw new Error(`No handler found for port ${port}`);
            }

            return await handler(req);
        },

        set: async (port: number, handler: (req: Request) => Promise<Response> | Response) => {
            this.loopback.resolver[port] = handler;
        },

        remove: async (port: number) => {
            delete this.loopback.resolver[port];
        },
    };

    // public HTTPSession: any;
    public WebSocket: any;
    // public CurlWebSocket: any;
    // public TLSSocket: any;
    public setUrl: (url: string) => void;

    public wisp = {
        wispConn: null as any,
        createStream: null as (...args: any[]) => any,
        WebSocket: null as WebSocket,
    };

    private paths = {
        lcJs: "/libs/libcurl-js/libcurl.mjs",
        lcWasm: "/libs/libcurl-js/libcurl.wasm",
        wisp: "/libs/wisp-client-js/wisp.js",
    };

    public direct = {
        wisp: null as any,
        libcurl: null as any,
    };

    private networkSettings: NetworkSettings;

    private session: any;

    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    constructor() { }

    public async init() {
        this.networkSettings = window.xen.settings.get("network-settings") || defaultSettings;
        window.xen.settings.set("network-settings", this.networkSettings);

        const lcModule = await import(this.paths.lcJs);
        this.direct.libcurl = lcModule.libcurl;
        await this.direct.libcurl.load_wasm(this.paths.lcWasm);
        console.log('[LC] js + wasm loaded');

        this.direct.wisp = await import(this.paths.wisp);
        this.wisp.wispConn = new this.direct.wisp.WispConnection(this.networkSettings.url);

        /*document.addEventListener("libcurl_load", () => {*/
            this.direct.libcurl.transport = this.networkSettings.transport;
            this.direct.libcurl.set_websocket(this.networkSettings.url);
            console.log('[LC] set url + transport');

            // this.HTTPSession = this.direct.libcurl.HTTPSession;
            this.WebSocket = this.direct.libcurl.WebSocket;
            // this.CurlWebSocket = this.direct.libcurl.CurlWebSocket;
            // this.TLSSocket = this.direct.libcurl.TLSSocket;

            this.setUrl = this.direct.libcurl.set_websocket;

            this.session = new this.direct.libcurl.HTTPSession({
                proxy: this.networkSettings.proxy
            });

            if (this.networkSettings.connections) {
                this.session.set_connections(...this.networkSettings.connections);
            }
        /*});*/

        this.wisp.wispConn.addEventListener("open", () => {
            this.wisp.createStream = (...args) => this.wisp.wispConn.create_stream(...args);
            this.wisp.WebSocket = this.direct.wisp.WispWebSocket;
        });
    }

    public onRequest(interceptor: RequestInterceptor): void {
        this.requestInterceptors.push(interceptor);
    }

    public onResponse(interceptor: ResponseInterceptor): void {
        this.responseInterceptors.push(interceptor);
    }

    async fetch(url: string | Request, options?: RequestInit): Promise<Response> {
        let requestObject: Request;
        let urlObject: URL;

        if (!this.direct.libcurl) {
            await this.init();
        }

        if (url instanceof Request) {
            requestObject = url;
        } else {
            requestObject = new Request(url, options);
        }

        urlObject = new URL(requestObject.url);

        if (!await networkHandler(urlObject)) {
            return new Response("Forbidden: Network policy denies access", {
                status: 403,
                statusText: "Forbidden",
            });
        }

        for (const interceptor of this.requestInterceptors) {
            const result = await Promise.resolve(interceptor(requestObject));

            if (result instanceof Response) {
                return result;
            }

            requestObject = result;
        }

        if (urlObject.hostname === "localhost") {
            let port: number = Number(urlObject.port);

            if (!port) {
                if (urlObject.protocol === "http:") {
                    port = 80;
                } else if (urlObject.protocol === "https:") {
                    port = 443;
                }
            }

            if (port in this.loopback.resolver) {
                return this.loopback.call(port, requestObject);
            }
        }

        let response = await this.session.fetch(requestObject, options);

        for (const interceptor of this.responseInterceptors) {
            response = await Promise.resolve(interceptor(response));
        }

        return response;
    }

    public encodeUrl(u: string): string {
        let e: string;

        if (u.startsWith(location.origin)) return u;

        if (u.startsWith("http://") || u.startsWith("https://")) {
            // @ts-ignore
            e = __uv$config.prefix + __uv$config.encodeUrl(u);
        } else {
            e = u;
        }

        return e;
    }
}