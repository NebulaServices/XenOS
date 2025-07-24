import { getDefault } from "./default";

async function readPolicies(folder: string): Promise<any[]> {
    const files = await window.xen.fs.list(folder);
    const policies: any[] = [];

    for (const file of files) {
        if (file.isFile && file.name.endsWith(".json")) {
            const path = `${folder}/${file.name}`;
            const content = await window.xen.fs.read(path, "text");

            if (typeof content === "string") {
                policies.push(JSON.parse(content));
            } else {
                console.error(`File content is not a string: ${path}`);
            }
        }
    }

    return policies;
}

function mergePolicies(policies: any[]): any {
    return policies.reduce((merged, policy) => {
        for (const k in policy) {
            if (Object.prototype.hasOwnProperty.call(policy, k)) {
                if (Array.isArray(policy[k])) {
                    merged[k] = [...(merged[k] || []), ...policy[k]];
                } else if (
                    typeof policy[k] === "object" &&
                    policy[k] !== null &&
                    !Array.isArray(policy[k])
                ) {
                    merged[k] = mergePolicies([merged[k] || {}, policy[k]]);
                } else {
                    merged[k] = policy[k];
                }
            }
        }
        return merged;
    }, {});
}

export async function getPolicy(policy: string): Promise<any> {
    const folder = `/usr/policies/${policy}`;
    const exists = await window.xen.fs.exists(folder);

    if (!exists) {
        await window.xen.fs.mkdir(folder);
        const defaultPolicy = getDefault(policy);
        await setPolicy(policy, "default.json", defaultPolicy);
    }

    const policies = await readPolicies(folder);
    const merged = mergePolicies(policies);

    const defaultPolicy = getDefault(policy);
    return mergePolicies([defaultPolicy, merged]);
}

export async function setPolicy(
    policy: string,
    file: string,
    content: any,
): Promise<void> {
    const folder = `/usr/policies/${policy}`;
    const path = `${folder}/${file}`;

    if (!(await window.xen.fs.exists(folder))) {
        await window.xen.fs.mkdir(folder);
    }

    await window.xen.fs.write(path, JSON.stringify(content, null, 2));
}