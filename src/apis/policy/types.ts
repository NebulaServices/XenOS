export interface NetworkPolicy {
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