import Model from '../model/Model';
export default interface IResource {
    url: string;
    getListType(): string;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    transformJsonBeforeSave(json: any): any;
    itemAdded(item: Model): any;
    itemDeleted(item: Model): any;
    itemSaved(itemOld: Model, item: Model): any;
}
