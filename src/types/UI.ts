
export interface PinnedWindowEntry {
    id: string;
    title: string;
    icon?: string;
    url: string;
    order: number;
}

export interface TaskBarEntry {
    itemId: string;
    instanceId: string | null;
    appId: string;
    title: string;
    icon?: string;
    url: string;
    isOpen: boolean;
    isPinned: boolean;
}

export type TaskBarDisplayMode = 'iconOnly' | 'iconAndName';

export interface WindowOpts {
    title: string;
    width?: string;
    height?: string;
    x?: number;
    y?: number;
    icon?: string;
    url?: string;
    content?: string;
    resizable?: boolean;
    display?: boolean;
}