export type RequestInterceptor = (request: Request) => Promise<Request | Response> | Request | Response;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;