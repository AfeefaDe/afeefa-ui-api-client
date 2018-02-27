export default class ResourceCache {
    private cache;
    purge(): void;
    getCache(key: any): any;
    addList(key: any, url: any, list: any): void;
    hasList(key: any, url: any): boolean;
    getList(key: any, url: any): any;
    purgeList(key: any, url?: any): void;
    addItem(key: any, item: any): void;
    hasItem(key: any, id?: any): boolean;
    getItem(key: any, id: any): any;
    purgeItem(key: any, id: any): void;
}
