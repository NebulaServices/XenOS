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

export interface PackagePolicy {
    allowed: string[] | "*";
    denied: string[] | "*";
    forceInstalled: string[];
}

export interface RepoPolicy {
    allowed: string[] | "*";
    denied: string[] | "*";
}