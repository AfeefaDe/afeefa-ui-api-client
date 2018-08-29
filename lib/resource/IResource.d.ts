import Model from '../model/Model';
export default interface IResource {
    lazyLoadList: boolean;
    getUrl(): string;
    getListType(): string;
    getListKey(): object;
    getDefaultListParams(): object;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    serializeAttachOrDetach(model: Model): string | object;
    serializeAttachOrDetachMany(models: Model[]): object;
    itemLoaded(model: Model): any;
    listLoaded(models: Model[], params?: object): any;
    itemAdded(model: Model): any;
    itemDeleted(model: Model): any;
    itemSaved(modelOld: Model, model: Model): any;
    itemAttached(model: Model): any;
    itemsAttached(models: Model[]): any;
    itemDetached(model: Model): any;
    includedRelationInitialized(models: Model[]): any;
}
