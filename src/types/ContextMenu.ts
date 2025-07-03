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