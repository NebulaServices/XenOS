export class URI {
    private handlers: Map<string, (data: string) => void | Promise<void>> = new Map();

    register(id: string, handler: (data: string) => void | Promise<void>) {
        if (!id || typeof handler !== 'function') {
            throw new Error('Invalid URI handler');
        }

        this.handlers.set(id, handler);
    }

    unregister(id: string) {
        if (!this.handlers.has(id)) {
            throw new Error(`Handler with id ${id} does not exist`);
        }

        this.handlers.delete(id);
    }

    handle(uri: string) {
        const index = uri.indexOf('://');
        if (index === -1) {
            throw new Error('Invalid URI format');
        }
        
        const scheme = uri.substring(0, index);
        const data = uri.substring(index + 3);
        const handler = this.handlers.get(scheme);

        if (!handler) {
            throw new Error(`No handler registered for ${scheme}`);
        }

        handler(data);
    }
}