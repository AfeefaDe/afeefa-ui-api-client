import API from '../api/Api';
import resourceCache from '../cache/ResourceCache';
export default class BaseResource {
    constructor() {
        this.url = '';
        this.Model = null;
        this._relation = null;
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
    getListKey() {
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
    find(id) {
        return API.find({ resource: this, id });
    }
    findAll(params) {
        return API.findAll({ resource: this, params });
    }
    // Api Hooks
    itemsLoaded(models) {
        // register parent relations after items have been added to cache
        models.map(model => {
            model.registerParentRelation(this.relation);
        });
    }
    itemLoaded(model) {
        // register parent relations after item has been added to cache
        model.registerParentRelation(this.relation);
    }
    itemAdded(model) {
        // register parent relations after item has been added to cache
        model.registerParentRelation(this.relation);
        // purge parent relation after item has been added to remote
        // POST /events -> invalidate App.events
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemDeleted(model) {
        // remove the deleted item from item cache
        // DELETE /events/123 -> purge events.123
        API.purgeItem(this, model.id);
        // remove the deleted item from all including lists
        // DELETE /events/123 -> invalidate App.events, Orga.123/events
        model.getParentRelations().forEach(relation => {
            relation.purgeFromCacheAndMarkInvalid();
        });
        // unregister all relations of this model
        for (const name of Object.keys(model.$rels)) {
            const relation = model.$rels[name];
            relation.unregisterModels();
        }
    }
    itemSaved(_modelOld, _model) {
        // hook into
        // there is no generic handling of saved items
    }
    itemAttached(model) {
        // register this relation with the just attached model
        model.registerParentRelation(this.relation);
        // purge list that have been attached to
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemDetached(model) {
        const relation = this.relation;
        // unregister this relation with the just detached model
        model.unregisterParentRelation(relation);
        // purge list that have been detached from
        relation.purgeFromCacheAndMarkInvalid();
    }
    /**
     * Convenient Resource Cache Access
     */
    cachePurgeList(type, key) {
        resourceCache.purgeList(type, key);
    }
    cacheGetAllLists(type) {
        return resourceCache.getCache(type).lists;
    }
    findCachedItem(type, id) {
        return resourceCache.getItem(type, id);
    }
    get relation() {
        return this._relation;
    }
    getItemModel(_json) {
        // hook into
        return this.Model;
    }
    clone() {
        console.log('clone', this.url, this.Model);
        const Constructor = this.constructor;
        const clone = new Constructor(this._relation);
        clone.url = this.url;
        clone.relationsToFetch = this.relationsToFetch;
        console.log('clone', clone.url, clone.Model);
        return clone;
    }
}
//# sourceMappingURL=BaseResource.js.map