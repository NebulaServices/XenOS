export interface AppManifest {
    title: string;
    packageId: string;
    icon: string;
    type: 'webview' | 'auto' | 'manual'
    source: {
        url?: string;
        index?: string;
        background?: string
    }
}

export type RegisteredApps = string[];