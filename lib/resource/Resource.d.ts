import Model from '../model/Model';
export default class Resource {
    listParams: any;
    url: any;
    http: any;
    constructor(...params: any[]);
    init(params?: any): void;
    /**
     * Resource Config
     */
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
    getItemModel(json: any): typeof Model;
    createItem(json: any): Model;
    transformList(items: any): void;
    /**
     * Api Hooks
     */
    itemAdded(item: any): void;
    itemDeleted(item: any): void;
    itemSaved(itemOld: any, item: any): void;
    /**
     * Resource Cache Access
     */
    cachePurgeList(key: any, url: any): void;
    cachePurgeRelation(relation: any): void;
    cachePurgeItem(key: any, id: any): void;
    cacheGetAllLists(key: any): any;
    findCachedItem(key: any, id: any): any;
}
