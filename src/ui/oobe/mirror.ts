export async function mirrorFS(): Promise<void> {
    const req = await fetch('/files.json');
    const res: Record<string, string[]> = await req.json();

    for (const [dir, files] of Object.entries(res)) {
        for (const file of files) {
            const path = (dir === "/" ? "" : dir) + "/" + file;
            const url = path;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Failed to fetch ${url}: ${response.statusText}`);
                    continue;
                }

                const contentType = response.headers.get("Content-Type") || "";
                let data: Uint8Array | string;

                if (contentType.startsWith("text/") || contentType === "application/javascript" || contentType === "application/json") {
                    data = await response.text();
                } else {
                    const buffer = await response.arrayBuffer();
                    data = new Uint8Array(buffer);
                }

                await window.xen.fs.write(path, data);
            } catch (err) {
                console.error(`Error mirroring ${path}:`, err);
            }
        }
    }
}
