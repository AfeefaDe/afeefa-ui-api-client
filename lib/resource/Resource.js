import resourceCache from '../cache/ResourceCache';
import Model from '../model/Model';
export default class Resource {
    constructor(...params) {
        this.url = '';
        this.init(...params);
    }
    init(_params) {
        // hook into
    }
    /**
     * Resource Config
     */
    getUrl() {
        return this.url || this.getItemModel().url;
    }
    getListType() {
        return this.getItemType();
    }
    /**
     * Since Search or Todos resources return lists of mixed items
     * we need to decide what resource cache key is to be
     * used based on the actual item's type.
     * @see Search or Todos resources
     */
    getItemType(json) {
        return this.getItemModel(json).type;
    }
    getItemId(json) {
        return this.getItemJson(json).id;
    }
    getItemJson(json) {
        return json;
    }
    getItemModel(_json) {
        // hook into
        return Model;
    }
    // creates a new model based on the given json response
    // @see Todos or Search
    createItem(json) {
        const item = new (this.getItemModel(json))();
        item.id = this.getItemId(json);
        return item;
    }
    // transforms the given list prior to caching
    // useful to create a hierachical list from a flat list
    // e.g. for cateories
    transformList(_items) {
        // hook into
    }
    /**
     * Api Hooks
     */
    // called after an item has been added
    // to enable custom resource cache treatment
    itemAdded(_item) {
        // hook into
    }
    // called after an item has been deleted
    // to enable custom resource cache treatment
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
}
//# sourceMappingURL=Resource.js.map