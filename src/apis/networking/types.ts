export type RequestInterceptor = (request: Request) => Promise<Request | Response> | Request | Response;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

export interface NetworkSettings {
    url: string;
    transport: 'wisp' | 'wsproxy';
    connections?: number[];
    proxy?: string;
}

export const defaultSettings: NetworkSettings = {
    url: (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/",
    transport: 'wisp'
}