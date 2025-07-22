import { NetworkPolicy } from "./types";

const defaultNetworkPolicy: NetworkPolicy = {
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

export function getDefault(policy: string) {
    switch (policy) {
        case "network":
            return defaultNetworkPolicy
        default:
            return;
    }
}