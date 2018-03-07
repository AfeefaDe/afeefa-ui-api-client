import API from '../api/Api';
import resourceCache from '../cache/ResourceCache';
export default class BaseResource {
    constructor() {
        this.url = '';
        this.Model = null;
        this.relationsToFetch = [];
    }
    /**
     * IResource
     */
    getUrl() {
        return this.url;
    }
    getListType() {
        return this.getItemType();
    }
    getListParams() {
        return {};
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
    // Api Hooks
    itemAdded(model) {
        this.cachePurgeList(model.type, '{}');
    }
    itemDeleted(model) {
        this.cachePurgeItem(model.type, model.id);
        this.cachePurgeList(model.type, '{}');
    }
    itemSaved(_modelOld, _model) {
        // hook into
    }
    itemAttached(_model) {
        // hook into
    }
    itemDetached(_model) {
        // hook into
    }
    /**
     * IQuery
     */
    with(...relations) {
        const clone = this.clone();
        clone.relationsToFetch = relations;
        return clone;
    }
    get(id, strategy) {
        if (!id) {
            return Promise.resolve(null);
        }
        return API.getItem({ resource: this, id, strategy }).then(model => {
            if (model) {
                model.fetchRelationsAfterGet(this.relationsToFetch);
            }
            return model;
        });
    }
    getAll(params) {
        return API.getList({ resource: this, params }).then(models => {
            models.forEach(model => {
                model.fetchRelationsAfterGet(this.relationsToFetch);
            });
            return models;
        });
    }
    save(model) {
        const action = model.id ? 'saveItem' : 'addItem';
        return API[action]({ resource: this, item: model });
    }
    delete(model) {
        return API.deleteItem({ resource: this, item: model });
    }
    attach(model) {
        return API.attachItem({ resource: this, item: model });
    }
    detach(model) {
        return API.detachItem({ resource: this, item: model });
    }
    /**
     * Convenient Resource Cache Access
     */
    cachePurgeList(type, url) {
        resourceCache.purgeList(type, url);
    }
    cachePurgeRelation(relation) {
        relation.purgeFromCacheAndMarkInvalid();
    }
    cachePurgeItem(type, id) {
        resourceCache.purgeItem(type, id);
    }
    cacheGetAllLists(type) {
        return resourceCache.getCache(type).lists;
    }
    findCachedItem(type, id) {
        return resourceCache.getItem(type, id);
    }
    getItemModel(_json) {
        // hook into
        return this.Model;
    }
    clone() {
        const Constructor = this.constructor;
        const clone = new Constructor();
        clone.url = this.url;
        clone.Model = this.Model;
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    }
}
//# sourceMappingURL=BaseResource.js.map