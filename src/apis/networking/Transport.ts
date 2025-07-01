/* TODO: Disect issues */

import type { BareHeaders, TransferrableResponse, BareTransport } from "@mercuryworkshop/bare-mux";

function bareToInit(headers: BareHeaders): HeadersInit {
    const result: [string, string][] = [];

    for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            for (const v of value) {
                result.push([key, v]);
            }
        } else {
            result.push([key, value]);
        }
    }

    return result;
}

function headersToBare(headers: Headers): BareHeaders {
    const result: BareHeaders = {};
    headers.forEach((value, key) => {
        if (result[key]) {
            if (Array.isArray(result[key])) {
                (result[key] as string[]).push(value);
            } else {
                result[key] = [result[key] as string, value];
            }
        } else {
            result[key] = value;
        }
    });
    return result;
}

export class XenTransport implements BareTransport {
    ready: boolean;

    constructor() {}
    async init() { this.ready = true; }
    async meta() {}

    async request(
        remote: URL,
        method: string,
        body: BodyInit | null,
        headers: BareHeaders,
        signal: AbortSignal | undefined
    ): Promise<TransferrableResponse> {
        const response = await window.xen.net.fetch(remote.href, {
            method,
            headers: bareToInit(headers),
            body,
            redirect: "manual",
            signal
        });

        return {
            body: response.body!,
            headers: headersToBare(response.headers),
            status: response.status,
            statusText: response.statusText,
        };
    }

    connect(
        url: URL,
        protocols: string[],
        requestHeaders: BareHeaders,
        onopen: (protocol: string) => void,
        onmessage: (data: Blob | ArrayBuffer | string) => void,
        onclose: (code: number, reason: string) => void,
        onerror: (error: string) => void,
    ): [(data: Blob | ArrayBuffer | string) => void, (code: number, reason: string) => void] {
        let socket = new window.xen.net.WebSocket(url.toString(), protocols);

        socket.binaryType = "arraybuffer";
        socket.onopen = () => { onopen("") };
        socket.onclose = (event: CloseEvent) => { onclose(event.code, event.reason) };
        socket.onerror = () => { onerror("") };
        socket.onmessage = (event: MessageEvent) => { onmessage(event.data); };

        return [
            (data) => {
                socket.send(data);
            },
            (code, reason) => {
                socket.close(code, reason)
            }
        ]
    }
}