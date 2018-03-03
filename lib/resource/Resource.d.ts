import Model from '../model/Model';
import Relation from '../model/Relation';
export default class Resource {
    url: string;
    http: any;
    constructor(...params: any[]);
    init(_params?: any): void;
    /**
     * Resource Config
     */
    getUrl(): string;
    getListType(): string;
    /**
     * Since Search or Todos resources return lists of mixed items
     * we need to decide what resource cache key is to be
     * used based on the actual item's type.
     * @see Search or Todos resources
     */
    getItemType(json?: any): string;
    getItemId(json: any): any;
    getItemJson(json: any): any;
    getItemModel(_json?: any): typeof Model;
    createItem(json: any): Model;
    transformList(_items: any): void;
    /**
     * Api Hooks
     */
    itemAdded(_item: any): void;
    itemDeleted(_item: any): void;
    itemSaved(_itemOld: any, _item: any): void;
    /**
     * Resource Cache Access
     */
    cachePurgeList(key: any, url: any): void;
    cachePurgeRelation(relation: Relation): void;
    cachePurgeItem(key: any, id: any): void;
    cacheGetAllLists(key: any): any;
    findCachedItem(key: any, id: any): any;
}
