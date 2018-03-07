import Model from '../model/Model';
export declare class ResourceCache {
    private cache;
    purge(): void;
    getCache(type: string): any;
    addList(type: string, key: string, params: string, list: Model[]): void;
    hasList(type: string, key: string, params: string): boolean;
    getList(type: string, key: string, params: string): Model[] | undefined;
    purgeList(type: string, key?: string, params?: string): void;
    addItem(type: any, item: Model): void;
    hasItem(type: string, id: string): boolean;
    getItem(type: string, id: string | null): Model | undefined;
    purgeItem(type: string, id: string): void;
}
declare const _default: ResourceCache;
export default _default;
