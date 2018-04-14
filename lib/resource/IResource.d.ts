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
    serializeAttachOrDetach(model: Model): string | object;
    serializeAttachOrDetachMany(models: Model[]): object;
    listLoaded(models: Model[], params?: object): any;
    itemAdded(model: Model): any;
    itemDeleted(model: Model): any;
    itemSaved(modelOld: Model, model: Model): any;
    itemAttached(model: Model): any;
    itemsAttached(models: Model[]): any;
    itemDetached(model: Model): any;
}
