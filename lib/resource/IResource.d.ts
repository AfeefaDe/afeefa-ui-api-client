import Model from '../model/Model';
export default interface IResource {
    getUrl(): string;
    getListType(): string;
    getListKey(): object;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    registerRelation(model: Model): any;
    unregisterRelation(model: Model): any;
    listLoaded(items: Model[], params?: object): any;
    itemAdded(item: Model): any;
    itemDeleted(item: Model): any;
    itemSaved(itemOld: Model, item: Model): any;
    itemAttached(item: Model): any;
    itemDetached(item: Model): any;
}
