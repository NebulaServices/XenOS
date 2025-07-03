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