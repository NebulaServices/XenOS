import { PRECACHE_RESOURCES } from "./cache";

let opfsRoot;

export async function getOpfsRoot() {
    if (!opfsRoot) opfsRoot = await navigator.storage.getDirectory();
    return opfsRoot;
}

async function ensure(
    root: FileSystemDirectoryHandle,
    path: string
): Promise<FileSystemFileHandle> {
    const parts = path.split("/").filter((p) => p.length > 0);
    const fileName = parts.pop();
    let currentDir = root;

    for (const part of parts) {
        try {
            currentDir = await currentDir.getDirectoryHandle(part, {
                create: true
            });
        } catch (err) {
            if (err.name === "TypeMismatchError") {
                await currentDir.removeEntry(part, { recursive: true });
    
                currentDir = await currentDir.getDirectoryHandle(part, {
                    create: true
                });
            } else {
                throw err;
            }
        }
    }

    try {
        return await currentDir.getFileHandle(fileName, { create: true });
    } catch (err) {
        if (err.name === "TypeMismatchError") {
            await currentDir.removeEntry(fileName, { recursive: true });
            return await currentDir.getFileHandle(fileName, { create: true });
        }

        throw err;
    }
}

export async function download(pathname: string, response: Response) {
    const root = await getOpfsRoot();
    const fileHandle = await ensure(root, `system${pathname}`);
    const writable = await fileHandle.createWritable();

    await writable.write(await response.arrayBuffer());
    await writable.close();
}

export async function preCache() {
    const root = await getOpfsRoot();
    for (const resource of PRECACHE_RESOURCES) {
        try {
            const parts = `system${resource}`
                .split("/")
                .filter((p) => p.length > 0);
            const fileName = parts.pop();
            let currentDir = root;

            for (const part of parts) {
                try {
                    currentDir = await currentDir.getDirectoryHandle(part, {
                        create: true
                    });
                } catch (err) {
                    if (err.name === "TypeMismatchError") {
                        await currentDir.removeEntry(part, { recursive: true });
                        currentDir = await currentDir.getDirectoryHandle(part, {
                            create: true
                        });
                    } else {
                        throw err;
                    }
                }
            }

            let exists = true;
            try {
                await currentDir.getFileHandle(fileName);
            } catch {
                exists = false;
            }

            if (!exists) {
                const res = await fetch(resource);
                if (res.ok) {
                    const fileHandle = await ensure(
                        root,
                        `system${resource}`
                    );
                    const writable = await fileHandle.createWritable();
                    await writable.write(await res.arrayBuffer());
                    await writable.close();
                }
            }
        } catch (err) {
            console.error("Precache failed for", resource, err);
        }
    }
}