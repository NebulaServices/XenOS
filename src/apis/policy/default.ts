import { NetworkPolicy, RepoPolicy, PackagePolicy } from "./types";

const networkP: NetworkPolicy = {
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

const repoP: RepoPolicy = {
    allowed: "*",
    denied: []
};

const packageP: PackagePolicy = {
    allowed: "*",
    denied: [],
    forceInstalled: ['']
}

export function getDefault(policy: string) {
    switch (policy) {
        case "network":
            return networkP;
        case "repo":
            return repoP;
        case "package":
            return packageP;
        default:
            return;
    }
}