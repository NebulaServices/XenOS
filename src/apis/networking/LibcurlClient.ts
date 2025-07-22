type RequestInterceptor = (request: Request) => Promise<Request | Response> | Request | Response;
type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

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
        allowed: (string | RegExp)[] | "*";
        denied: (string | RegExp)[] | "*";
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

    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    constructor() { }

    public async init() {
        this.networkPolicy = await window.xen.settings.get("network-policy") || defaultPolicy;
        await window.xen.settings.set("network-policy", this.networkPolicy);

        this.networkSettings = await window.xen.settings.get("network-settings") || defaultSettings;
        await window.xen.settings.set("network-settings", this.networkSettings);

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

    private parsePolicy<T extends (string | number | RegExp)[] | "*" >(
        rules: T,
        type: 'domain' | 'ip' | 'port'
    ): T {
        if (rules === "*") return "*" as T;

        return rules.map(rule => {
            if (typeof rule === 'string') {
                if (rule.startsWith('/') && rule.endsWith('/')) {
                    try {
                        return new RegExp(rule.slice(1, -1));
                    } catch (e) {
                        console.error(`Invalid regex in network policy for ${type}:`, rule, e);
                        if (type === 'domain') {
                            try {
                                return new URL(rule).hostname;
                            } catch (e) {
                                return rule;
                            }
                        }

                        return rule;
                    }
                } else if (type === 'domain') {
                    try {
                        return new URL(rule).hostname;
                    } catch (e) {
                        return rule;
                    }
                }
            }

            return rule;
        }) as T;
    }


    private matchPolicy(
        value: string | number,
        policy: (string | number | RegExp)[] | "*"
    ): boolean {
        if (policy === "*") return true;

        for (const rule of policy) {
            if (typeof rule === "string" && rule === value) return true;
            if (typeof rule === "number" && rule === value) return true;
            if (rule instanceof RegExp && typeof value === "string" && rule.test(value)) return true;
            if (rule instanceof RegExp && typeof value === "number" && rule.test(String(value))) return true;
        }

        return false;
    }

    private async policyHandler(url: URL): Promise<boolean> {
        const settings: NetworkPolicy = await window.xen.settings.get("network-policy");

        this.networkPolicy = {
            ports: {
                allowed: this.parsePolicy(settings.ports.allowed, 'port'),
                denied: this.parsePolicy(settings.ports.denied, 'port')
            },
            ips: {
                allowed: this.parsePolicy(settings.ips.allowed, 'ip'),
                denied: this.parsePolicy(settings.ips.denied, 'ip')
            },
            domains: {
                allowed: this.parsePolicy(settings.domains.allowed, 'domain'),
                denied: this.parsePolicy(settings.domains.denied, 'domain')
            },
            denyHTTP: settings.denyHTTP
        };

        const { ports, ips, domains, denyHTTP } = this.networkPolicy;
        const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);

        if (denyHTTP && url.protocol === "http:") return false;

        if (!this.matchPolicy(port, ports.allowed)) return false;
        if (this.matchPolicy(port, ports.denied)) return false;
        if (!this.matchPolicy(url.hostname, ips.allowed)) return false;
        if (this.matchPolicy(url.hostname, ips.denied)) return false;
        if (!this.matchPolicy(url.hostname, domains.allowed)) return false;
        if (this.matchPolicy(url.hostname, domains.denied)) return false;

        return true;
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

        if (!(await this.policyHandler(urlObject))) {
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