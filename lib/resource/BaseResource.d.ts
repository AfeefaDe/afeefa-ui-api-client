import Model from '../model/Model';
import Relation from '../model/Relation';
import IResource from './IResource';
export default class BaseResource implements IResource {
    url: string;
    protected Model: typeof Model | null;
    getListType(): string;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    transformJsonBeforeSave(json: any): any;
    itemAdded(_item: Model): void;
    itemDeleted(_item: Model): void;
    itemSaved(_itemOld: Model, _item: Model): void;
    /**
     * Resource Cache Access
     */
    cachePurgeList(key: any, url: any): void;
    cachePurgeRelation(relation: Relation): void;
    cachePurgeItem(key: any, id: any): void;
    cacheGetAllLists(key: any): any;
    findCachedItem(key: any, id: any): any;
    protected init(): void;
    protected getItemModel(_json: any): typeof Model;
}
