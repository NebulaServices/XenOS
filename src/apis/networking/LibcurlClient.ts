import { networkHandler } from "../policy/handler";

type RequestInterceptor = (request: Request) => Promise<Request | Response> | Request | Response;
type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

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

    public WebSocket: WebSocket;
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

    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    private wispUrl: string;

    public async init() {
        this.wispUrl = window.xen.settings.get('wisp-url');

        if (!this.wispUrl) {
            window.xen.settings.set('wisp-url', (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/");
            this.wispUrl = window.xen.settings.get('wisp-url');
        }

        const lcModule = await import(this.paths.lcJs);
        this.direct.libcurl = lcModule.libcurl;
        await this.direct.libcurl.load_wasm(this.paths.lcWasm);


        this.direct.wisp = await import(this.paths.wisp);
        this.wisp.wispConn = new this.direct.wisp.WispConnection(this.wispUrl);

        this.direct.libcurl.set_websocket(this.wispUrl);

        this.WebSocket = this.direct.libcurl.WebSocket
        this.setUrl = this.direct.libcurl.set_websocket;

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

        if (this.isP2PUrl(urlObject)) {
            const peerId = urlObject.hostname;
            let port: number = Number(urlObject.port);

            if (!port) {
                if (urlObject.protocol === "http:") {
                    port = 80;
                } else if (urlObject.protocol === "https:") {
                    port = 443;
                }
            }

            const p2pUrl = `${urlObject.protocol}//${urlObject.hostname}:${port}${urlObject.pathname}${urlObject.search}${urlObject.hash}`;

            if (window.xen?.p2p?.fetch) {
                return window.xen.p2p.fetch(peerId, p2pUrl, options);
            } else {
                return new Response("P2P client not available", {
                    status: 503,
                    statusText: "Service Unavailable",
                });
            }
        }

        let response = await this.direct.libcurl.fetch(requestObject, options);

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

    public decodeUrl(u: string): string {
        //@ts-ignore
        u = u.split(__uv$config.prefix)[1];
        //@ts-ignore
        u = __uv$config.decodeUrl(u);

        return u;
    }

    private isP2PUrl(urlObject: URL): boolean {
        const hostname = urlObject.hostname;

        return (
            hostname !== 'localhost' &&
            !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) && // Not IPv4
            !/^[0-9a-f:]+$/i.test(hostname) && // Not IPv6
            /^[a-z0-9]{9}$/i.test(hostname) // 9c Peer ID format
        );
    }
}