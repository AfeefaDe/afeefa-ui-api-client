import resourceCache from '../cache/ResourceCache';
export default class BaseResource {
    constructor() {
        this.url = '';
        this.Model = null;
    }
    getListType() {
        return this.getItemType();
    }
    getItemType(json) {
        return this.getItemModel(json).type;
    }
    getItemJson(json) {
        return json;
    }
    createItem(json) {
        const item = new (this.getItemModel(json))();
        item.id = json.id;
        return item;
    }
    transformJsonBeforeSave(json) {
        // hook into
        return json;
    }
    itemAdded(_item) {
        // hook into
    }
    itemDeleted(_item) {
        // hook into
    }
    itemSaved(_itemOld, _item) {
        // hook into
    }
    /**
     * Resource Cache Access
     */
    cachePurgeList(key, url) {
        resourceCache.purgeList(key, url);
    }
    cachePurgeRelation(relation) {
        relation.purgeFromCacheAndMarkInvalid();
    }
    cachePurgeItem(key, id) {
        resourceCache.purgeItem(key, id);
    }
    cacheGetAllLists(key) {
        return resourceCache.getCache(key).lists;
    }
    findCachedItem(key, id) {
        return resourceCache.getItem(key, id);
    }
    init() {
        // hook into
    }
    getItemModel(_json) {
        // hook into
        return this.Model;
    }
}
//# sourceMappingURL=BaseResource.js.map