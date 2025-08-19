// Vibecoded WebDAV (Made for Copyparty) FS implementation
class WebDAVFS extends window.xen.FileSystem {
    constructor(baseUrl, username, password) {
        super();
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.username = username;
        this.password = password;
        this.cwd = '/';
    }

    async request(method, path, body = null, headers = {}) {
        const url = this.baseUrl + this.normalizePath(path);
        const auth = 'Basic ' + btoa(`${this.username}:${this.password}`);
        
        const requestHeaders = {
            'Authorization': auth,
            ...headers
        };

        if (body && typeof body === 'string') {
            requestHeaders['Content-Type'] = 'text/plain; charset=utf-8';
        }

        const response = await window.xen.net.fetch(url, {
            method,
            headers: requestHeaders,
            body
        });

        return response;
    }

    parseDirectoryListing(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const responses = doc.querySelectorAll('response');
        const entries = [];

        responses.forEach(response => {
            const href = response.querySelector('href')?.textContent;
            if (!href) return;

            const decodedHref = decodeURIComponent(href);
            const pathParts = decodedHref.split('/').filter(Boolean);
            const name = pathParts[pathParts.length - 1];
            
            if (!name) return;

            const resourceType = response.querySelector('resourcetype');
            const isDirectory = resourceType?.querySelector('collection') !== null;
            
            entries.push({
                name: name,
                isFile: !isDirectory,
                isDirectory: isDirectory
            });
        });

        return entries;
    }

    async mkdir(path) {
        const response = await this.request('MKCOL', path);
        
        if (!response.ok && response.status !== 405) {
            throw new Error(`Failed to create directory: ${response.status} ${response.statusText}`);
        }
    }

    async list(path, recursive = false) {
        const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
    <prop>
        <resourcetype/>
        <getcontentlength/>
        <getlastmodified/>
    </prop>
</propfind>`;

        const response = await this.request('PROPFIND', path, propfindBody, {
            'Content-Type': 'application/xml; charset=utf-8',
            'Depth': '1'
        });

        if (!response.ok) {
            throw new Error(`Failed to list directory: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const entries = this.parseDirectoryListing(xmlText);
        const currentPath = this.normalizePath(path);
        const filtered = entries.filter(entry => {
            return entry.name !== currentPath.split('/').pop();
        });

        if (recursive) {
            const allEntries = [...filtered];
            for (const entry of filtered) {
                if (entry.isDirectory) {
                    try {
                        const subPath = this.normalizePath(`${path}/${entry.name}`);
                        const subEntries = await this.list(subPath, true);
                        
                        subEntries.forEach(subEntry => {
                            allEntries.push({
                                name: `${entry.name}/${subEntry.name}`,
                                isFile: subEntry.isFile,
                                isDirectory: subEntry.isDirectory
                            });
                        });
                    } catch (e) {
                        console.warn(`Failed to list subdirectory ${entry.name}:`, e);
                    }
                }
            }
            return allEntries;
        }

        return filtered;
    }

    async rm(path) {
        const response = await this.request('DELETE', path);
        
        if (!response.ok) {
            throw new Error(`Failed to delete: ${response.status} ${response.statusText}`);
        }
    }

    async write(path, content) {
        let body;
        
        if (typeof content === 'string') {
            body = content;
        } else if (content instanceof ArrayBuffer) {
            body = content;
        } else if (content instanceof Blob) {
            body = await content.arrayBuffer();
        } else if (content instanceof Uint8Array) {
            body = content.buffer;
        } else {
            throw new Error('Unsupported content type');
        }

        const response = await this.request('PUT', path, body);
        
        if (!response.ok) {
            throw new Error(`Failed to write file: ${response.status} ${response.statusText}`);
        }
    }

    async read(path, format = 'text') {
        const response = await this.request('GET', path);
        
        if (!response.ok) {
            throw new Error(`Failed to read file: ${response.status} ${response.statusText}`);
        }

        switch (format) {
            case 'text':
                return await response.text();
            case 'arrayBuffer':
                return await response.arrayBuffer();
            case 'uint8array':
                const arrayBuffer = await response.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            case 'blob':
            default:
                return await response.blob();
        }
    }

    async cd(path) {
        const normalizedPath = this.normalizePath(path);

        try {
            await this.list(normalizedPath);
            this.cwd = normalizedPath;
        } catch (error) {
            throw new Error(`Cannot change to directory ${path}: ${error.message}`);
        }
    }

    async exists(path) {
        try {
            const response = await this.request('HEAD', path);
            return response.ok;
        } catch {
            return false;
        }
    }
}

window.webdavFS = new WebDAVFS('https://your.webdav_or_copyparty.server', 'username (if copyparty, probably `k`', 'password');
await window.xen.vfs.mount('/webdav', window.webdavFS);