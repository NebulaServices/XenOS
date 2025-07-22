import { NetworkPolicy } from "./types";

export async function networkHandler(url: URL): Promise<boolean> {
    const raw = await window.xen.fs.read(`/system/policies/network.json`, 'text') as string;
    const policy = JSON.parse(raw);
    let rewrittenPolicy: NetworkPolicy = policy; 

    if (policy.domains.denied instanceof Array) {
        rewrittenPolicy.domains.denied = policy.domains.denied.map((domain: string) => {
            const hostname = new URL(domain).hostname;
            return hostname;
        });
    }

    const { ports, ips, domains, denyHTTP } = rewrittenPolicy;
    const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);

    if (denyHTTP && url.protocol === "http:") return false;
    if (ports.allowed !== "*" && !ports.allowed.includes(port)) return false;
    if (ports.denied !== "*" && ports.denied.includes(port)) return false;
    if (ips.allowed !== "*" && !ips.allowed.includes(url.hostname)) return false;
    if (ips.denied !== "*" && ips.denied.includes(url.hostname)) return false;
    if (domains.allowed !== "*" && !domains.allowed.includes(url.hostname)) return false;
    if (domains.denied !== "*" && domains.denied.includes(url.hostname)) return false; 

    return true;
}