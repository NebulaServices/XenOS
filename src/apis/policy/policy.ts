import { getDefault } from "./default";

async function readPolicies(folder: string): Promise<any[]> {
    const files = await window.xen.fs.list(folder);
    const policies = [];

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
        for (const key in policy) {
            if (Array.isArray(policy[key])) {
                merged[key] = [...(merged[key] || []), ...policy[key]];
            } else if (typeof policy[key] === "object") {
                merged[key] = mergePolicies([merged[key] || {}, policy[key]]);
            } else {
                merged[key] = policy[key];
            }
        }

        return merged;
    }, {});
}

export async function getPolicy(policy: string): Promise<any> {
    const folderPath = `/system/policies/${policy}`;
    const exists = await window.xen.fs.exists(folderPath);

    if (!exists) {
        await window.xen.fs.mkdir(folderPath);
        const defaultPolicy = getDefault(policy);
        await setPolicy(policy, "default.json", defaultPolicy);
    }

    const policies = await readPolicies(folderPath);
    const mergedPolicy = mergePolicies(policies);

    const defaultPolicy = getDefault(policy);
    return { ...defaultPolicy, ...mergedPolicy };
}

export async function setPolicy(policy: string, fileName: string, content: any): Promise<void> {
    const folderPath = `/system/policies/${policy}`;
    const filePath = `${folderPath}/${fileName}`;

    if (!(await window.xen.fs.exists(folderPath))) {
        await window.xen.fs.mkdir(folderPath);
    }

    await window.xen.fs.write(filePath, JSON.stringify(content, null, 2));
}