import mime from "mime";
import { FileSystem } from "./FileSystem";

export interface FileHandlerOptions {
    path: string;
    fs: FileSystem;
    callback?: (path: string, url: string, mime: string) => void;
}

export class FileHandler {
    private static instance: FileHandler;

    public static getInstance(): FileHandler {
        if (!FileHandler.instance) {
            FileHandler.instance = new FileHandler();
        }
        return FileHandler.instance;
    }

    private constructor() {}

    /**
     * Universal file opening handler that works with any FileSystem implementation
     */
    async open(options: FileHandlerOptions): Promise<void> {
        const { path, fs, callback } = options;

        // Check if the path exists
        if (!(await fs.exists(path))) {
            throw new Error(`File not found: ${path}`);
        }

        // Read the file as a blob
        const blob = await fs.read(path, "blob") as Blob;
        
        // Create an object URL for the file
        const url = URL.createObjectURL(blob);
        
        // Determine MIME type
        const mt = blob.type || mime.getType(path) || 'application/octet-stream';

        // If callback is provided, use it
        if (callback) {
            callback(path, url, mt);
            return;
        }

        // Default file handling based on MIME type
        await this.handleFileByMimeType(path, url, mt);
    }

    /**
     * Handle file opening based on MIME type using default applications
     */
    private async handleFileByMimeType(path: string, url: string, mimeType: string): Promise<void> {
        if (mimeType.startsWith('text/') || mimeType === 'application/json') {
            // Open text files in text editor
            window.xen.packages.open('org.nebulaservices.texteditor', {
                file: path
            });
        } else if (mimeType.startsWith('image/')) {
            // Open images in image viewer
            window.xen.wm.create({
                title: 'Image Viewer',
                icon: '/assets/logo.svg',
                content: `
                    <div style="width: 100%; height: 100%; overflow: auto; display: flex; align-items: center; justify-content: center;">
                        <img 
                            src="${url}"
                            style="max-width: 100%; max-height: 100%; object-fit: contain;"
                        >
                    </div>`
            });
        } else if (mimeType.startsWith('video/')) {
            // Open videos in video player
            window.xen.wm.create({
                title: 'Video Player',
                icon: '/assets/logo.svg',
                content: `
                    <div style="width: 100%; height: 100%; overflow: auto; background: #000; display: flex; align-items: center; justify-content: center;">
                        <video
                            controls
                            style="max-width: 100%; max-height: 100%;"
                        >
                            <source src="${url}">
                        </video>
                    </div>
                `
            });
        } else if (mimeType.startsWith('audio/')) {
            // Open audio files in music player
            window.xen.wm.create({
                title: 'Music Player',
                icon: '/assets/logo.svg',
                content: `
                    <div style="width: 100%; height: 100%; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
                        <audio controls style="width: 100%; max-width: 500px;">
                            <source src="${url}">
                        </audio>
                    </div>
                `
            });
        } else if (mimeType === 'application/pdf') {
            // Open PDF files in iframe
            window.xen.wm.create({
                title: 'PDF Viewer',
                icon: '/assets/logo.svg',
                content: `
                    <div style="width: 100%; height: 100%; overflow: auto;">
                        <iframe 
                            src="${url}" 
                            width="100%" 
                            height="100%" 
                            frameborder="0"
                            style="border: none;">
                        </iframe>
                    </div>
                `
            });
        } else {
            // Show notification for unsupported file types
            window.xen.notifications.spawn({
                title: 'XenOS',
                description: `This file type is unsupported: ${mimeType}`,
                icon: '/assets/logo.svg',
                timeout: 2500
            });
        }
    }

    /**
     * Register a custom file handler for specific MIME types
     */
    registerHandler(mimeType: string, handler: (path: string, url: string, mimeType: string) => Promise<void>): void {
        // TODO: Implement custom handler registration system
        // This could be stored in a Map and checked before default handling
    }

    /**
     * Clean up object URLs to prevent memory leaks
     */
    cleanupUrl(url: string): void {
        URL.revokeObjectURL(url);
    }
}
