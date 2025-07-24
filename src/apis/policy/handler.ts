import { NetworkPolicy, RepoPolicy, PackagePolicy } from "./types";
import { getPolicy } from "./policy";
import { getDefault } from "./default";

function matchesPattern(patterns: (string | RegExp)[] | "*", value: string): boolean {
    if (patterns === "*") {
        return true;
    }

    if (!Array.isArray(patterns)) {
        return false;
    }

    return patterns.some((pattern) =>
        typeof pattern === "string" ? pattern === value : pattern instanceof RegExp && pattern.test(value)
    );
}

export async function networkHandler(url: URL): Promise<boolean> {
    const defaultPolicy: NetworkPolicy = getDefault('network') as NetworkPolicy;

    const policy = { ...defaultPolicy, ...(await getPolicy("network")) };
    let rewrittenPolicy: NetworkPolicy = policy;

    if (policy.domains.denied instanceof Array) {
        rewrittenPolicy.domains.denied = policy.domains.denied.map((domain: string) => {
            const hostname = new URL(domain).hostname;
            return hostname;
        });
    }

    if (policy.domains.allowed instanceof Array) {
        rewrittenPolicy.domains.allowed = policy.domains.allowed.map((domain: string) => {
            const hostname = new URL(domain).hostname;
            return hostname;
        });
    }

    const { ports, ips, domains, denyHTTP } = policy;
    const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);

    if (denyHTTP && url.protocol === "http:") return false;
    if (ports.allowed !== "*" && !ports.allowed.includes(port)) return false;
    if (ports.denied !== "*" && ports.denied.includes(port)) return false;
    if (ips.allowed !== "*" && !matchesPattern(ips.allowed, url.hostname)) return false;
    if (ips.denied !== "*" && matchesPattern(ips.denied, url.hostname)) return false;
    if (domains.allowed !== "*" && !matchesPattern(domains.allowed, url.hostname)) return false;
    if (domains.denied !== "*" && matchesPattern(domains.denied, url.hostname)) return false;

    return true;
}

export async function repoHandler(url: URL): Promise<boolean> {
    const defaultPolicy: RepoPolicy = getDefault('repo') as RepoPolicy;
    const policy = { ...defaultPolicy, ...(await getPolicy("repo")) };

    let rewrittenPolicy: RepoPolicy = policy;

    if (policy.denied instanceof Array) {
        rewrittenPolicy.denied = policy.denied.map((domain: string) => {
            const hostname = new URL(domain).hostname;
            return hostname;
        });
    }

    if (policy.allowed instanceof Array) {
        rewrittenPolicy.allowed = policy.allowed.map((domain: string) => {
            const hostname = new URL(domain).hostname;
            return hostname;
        });
    }

    const { allowed, denied } = rewrittenPolicy;

    if (allowed !== "*" && !allowed.includes(url.hostname)) return false;
    if (denied !== "*" && denied.includes(url.hostname)) return false;

    return true;
}

export async function packageHandler(id: string, type: 'install' | 'uninstall'): Promise<boolean> {
    const defaultPolicy: PackagePolicy = getDefault('package') as PackagePolicy;
    const policy = { ...defaultPolicy, ...(await getPolicy("package")) };

    if (type == 'install') {
        if (policy.allowed !== "*" && !policy.allowed.includes(id)) return false;
        if (policy.denied !== "*" && policy.denied.includes(id)) return false;
    }

    if (type == 'uninstall') {
        if (policy.forceInstalled.includes(id)) return false;
    }

    return true;
}