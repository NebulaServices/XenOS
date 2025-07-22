import { getDefault } from "./default";

export async function getPolicy(policy: string) {
    if (!await window.xen.fs.exists(`/system/policies/${policy}.json`)) {
        await setPolicy('network', getDefault('network'));
    }

    const file = await window.xen.fs.read(`/system/policies/${policy}.json`, 'text') as string;
    return JSON.parse(file);
}

export async function setPolicy(policy: string, content: any) {
    await window.xen.fs.write(`/system/policies/${policy}.json`, JSON.stringify(content));
}