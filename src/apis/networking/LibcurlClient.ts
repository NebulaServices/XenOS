interface NetworkPolicy {
    ports: {
        allowed: number[] | "*";
        denied: number[] | "*";
    }

    ips: {
        allowed: string[] | "*";
        denied: string[] | "*";
    }

    domains: {
        allowed: string[] | "*";
        denied: string[] | "*";
    }

    denyHTTP: boolean
}

const defaultPolicy: NetworkPolicy = {
    ports: {
        allowed: "*",
        denied: []
    },
    ips: {
        allowed: "*",
        denied: []
    },
    domains: {
        allowed: "*",
        denied: []
    },
    denyHTTP: false
};

interface NetworkSettings {
    url: string;
    transport: 'wisp' | 'wsproxy';
    connections?: number[];
    proxy?: string;
}

const defaultSettings: NetworkSettings = {
    url: (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/",
    transport: 'wisp'
}

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

    public HTTPSession: any;
    public WebSocket: any;
    public CurlWebSocket: any;
    public TLSSocket: any;
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

    private networkPolicy: NetworkPolicy;
    private networkSettings: NetworkSettings;
    private session: any;

    constructor() { }

    public async init() {
        this.networkPolicy = window.xen.settings.get("network-policy") || defaultPolicy;
        window.xen.settings.set("network-policy", this.networkPolicy);

        this.networkSettings = window.xen.settings.get("network-settings") || defaultSettings;
        window.xen.settings.set("network-settings", this.networkSettings);

        const lcModule = await import(this.paths.lcJs);
        this.direct.libcurl = lcModule.libcurl;
        this.direct.libcurl.load_wasm(this.paths.lcWasm);

        this.direct.wisp = await import(this.paths.wisp);
        this.wisp.wispConn = new this.direct.wisp.WispConnection(this.networkSettings.url);

        document.addEventListener("libcurl_load", () => {
            this.direct.libcurl.transport = this.networkSettings.transport;
            this.direct.libcurl.set_websocket(this.networkSettings.url);

            this.HTTPSession = this.direct.libcurl.HTTPSession;
            this.WebSocket = this.direct.libcurl.WebSocket;
            this.CurlWebSocket = this.direct.libcurl.CurlWebSocket;
            this.TLSSocket = this.direct.libcurl.TLSSocket;

            this.setUrl = this.direct.libcurl.set_websocket;

            this.session = new this.direct.libcurl.HTTPSession({
                proxy: this.networkSettings.proxy
            });

            if (this.networkSettings.connections) {
                this.session.set_connections(...this.networkSettings.connections);
            }
        });

        this.wisp.wispConn.addEventListener("open", () => {
            this.wisp.createStream = (...args) => this.wisp.wispConn.create_stream(...args);
            this.wisp.WebSocket = this.direct.wisp.WispWebSocket;
        });
    }

    private policyHandler(url: URL): boolean {
        const settings: NetworkPolicy = window.xen.settings.get("network-policy");

        if (settings.domains.denied instanceof Array) {
            settings.domains.denied = settings.domains.denied.map((domain: string) => {
                const hostname = new URL(domain).hostname;
                return hostname;
            });

            this.networkPolicy = settings;
        }

        const { ports, ips, domains, denyHTTP } = this.networkPolicy;
        const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);

        if (denyHTTP && url.protocol === "http:") return false;
        if (ports.allowed !== "*" && !ports.allowed.includes(port)) return false;
        if (ports.denied !== "*" && ports.denied.includes(port)) return false;
        if (ips.allowed !== "*" && !ips.allowed.includes(url.hostname)) return false;
        if (ips.denied !== "*" && ips.denied.includes(url.hostname)) return false;
        if (domains.allowed !== "*" && !domains.allowed.includes(url.hostname))
            return false;
        if (domains.denied !== "*" && domains.denied.includes(url.hostname))
            return false;

        return true;
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

        if (!this.policyHandler(urlObject)) {
            return new Response("Forbidden: Network policy denies access", {
                status: 403,
                statusText: "Forbidden",
            });
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

        return this.session.fetch(url, options);
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