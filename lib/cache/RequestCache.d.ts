export default class RequestCache {
    addItem(key: any, promise: any): void;
    hasItem(key: any): boolean;
    getItem(key: any): any;
    purgeItem(key: any): void;
}
