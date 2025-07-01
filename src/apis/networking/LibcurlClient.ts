/*
const client = new LibcurlClient({
    options: {
        url: (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/",
        transport: 'wisp',
        proxy: 'socks5h',
        connections: [30, 20, 1]
    },
    policy: {
        domains: {
            allow: ['*'],
            deny: ['example.com']
        },
        ips: {
            allow: ['*'],
            deny: ['152.53.90.161']
        }
    }
});
*/

export class LibcurlClient {
    // Loopback
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
        }
    };

    // Libcurl.js methods (No types)
    public HTTPSession: any;
    public WebSocket: any;
    public CurlWebSocket: any;
    public TLSSocket: any;
    public setUrl: (url: string) => void;

    // wisp-client-js methods (no types)
    public wisp = {
        wispConn: null as any,
        createStream: null as (...args: any[]) => any,
        WebSocket: null as WebSocket
    };

    // Paths for importing modules
    private lcJsPath = '/libs/libcurl-js/libcurl.mjs';
    private lcWasmPath = '/libs/libcurl-js/libcurl.wasm';
    private wispPath = '/libs/wisp-client-js/wisp.js';

    // Shared
    public wispUrl: string;
    public direct = {
        wisp: null as any,
        libcurl: null as any
    }

    constructor(url: string) {
        this.wispUrl = url;
    }

    public async init() {
        // Import libcurl.js
        const lcModule = await import(this.lcJsPath);
        this.direct.libcurl = lcModule.libcurl;
        this.direct.libcurl.load_wasm(this.lcWasmPath);

        // Import wisp-client-js 
        this.direct.wisp = await import(this.wispPath);
        this.wisp.wispConn = new this.direct.wisp.WispConnection(this.wispUrl);

        // Setup libcurl.js onload
        document.addEventListener("libcurl_load", () => {
            this.direct.libcurl.set_websocket(this.wispUrl);

            this.HTTPSession = this.direct.libcurl.HTTPSession;
            this.WebSocket = this.direct.libcurl.WebSocket;
            this.CurlWebSocket = this.direct.libcurl.CurlWebSocket;
            this.TLSSocket = this.direct.libcurl.TLSSocket;

            this.setUrl = this.direct.libcurl.set_websocket;
        });

        // Setup wisp-client-js on load
        this.wisp.wispConn.addEventListener("open", () => {
            this.wisp.createStream = (...args) => this.wisp.wispConn.create_stream(...args);
            this.wisp.WebSocket = this.direct.wisp.WispWebSocket;
        });
    }

    // Custom fetch method that based on libcurl.js that hooks into loopbacks
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

        if (urlObject.hostname === 'localhost') {
            let port: number = Number(urlObject.port);

            if (!port) {
                if (urlObject.protocol === 'http:') {
                    port = 80;
                } else if (urlObject.protocol === 'https:') {
                    port = 443;
                }
            }

            if (port in this.loopback.resolver) {
                return this.loopback.call(port, requestObject);
            }
        }

        return this.direct.libcurl.fetch(url, options);
    }
}
