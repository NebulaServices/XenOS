export class XenTransport {
    ready = true;

    constructor() { };
    async init() { this.ready = true };
    async meta() { }

    async request(
        remote: URL,
        method: string,
        body: BodyInit | null,
        headers: any,
        signal: AbortSignal | undefined,
    ): Promise<any> {
        const payload = await window.xen.net.fetch(remote.href, {
            method,
            headers: headers,
            body,
            redirect: "manual",
            //@ts-ignore
            duplex: "half",
        });

        const resHeaders = {};

        //@ts-ignore
        if (payload.raw_headers) {
            //@ts-ignore
            for (const [k, v] of payload.raw_headers) {
                if (!resHeaders[k]) {
                    resHeaders[k] = [v];
                } else {
                    resHeaders[k].push(v);
                }
            }
        }

        return {
            body: payload.body!,
            headers: resHeaders,
            status: payload.status,
            statusText: payload.statusText,
        };
    }

    connect(
        url: URL,
        origin: string,
        protocols: string[],
        requestHeaders: any,
        onopen: (protocol: string) => void,
        onmessage: (data: Blob | ArrayBuffer | string) => void,
        onclose: (code: number, reason: string) => void,
        onerror: (error: string) => void,
    ): [
            (data: Blob | ArrayBuffer | string) => void,
            (code: number, reason: string) => void,
        ] {
        const socket = new window.xen.net.WebSocket(url.toString(), protocols, {
            headers: requestHeaders,
        });

        socket.binaryType = "arraybuffer";

        socket.onopen = (event: Event) => { onopen(""); };
        socket.onclose = (event: CloseEvent) => { onclose(event.code, event.reason); };
        socket.onerror = (event: Event) => { onerror(""); };
        socket.onmessage = (event: MessageEvent) => { onmessage(event.data); };

        return [
            (data) => {
                socket.send(data);
            },
            (code, reason) => {
                socket.close(code, reason);
            },
        ];
    }
}
