export interface ContextMenuEntry {
    id: string;
    domain: string;
    title: string;
    funcId: string;
    funcArgs?: any[];
}

export interface FunctionRegistry {
    [funcId: string]: (...args: any[]) => void;
}

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
    icon?: string;
    width?: string;
    height?: string;
    x?: number;
    y?: number;
    url: string;
}