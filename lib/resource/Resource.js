import API from '../api/Api';
import resourceCache from '../cache/ResourceCache';
import { Instance as App } from '../model/App';
import Relation from '../model/Relation';
export default class Resource {
    constructor(type, relation) {
        this.url = '';
        this.Model = null;
        this._relation = null;
        this.relationsToFetch = [];
        this.type = '';
        this.type = type || Resource.TYPE_APP;
        if (relation) {
            this._relation = relation;
            this.Model = relation.Model;
        }
        else {
            const listType = this.getListType();
            if (!listType) {
                throw new Error('The resource needs to define a list type');
            }
            this._relation = App.getRelationByType(listType);
        }
    }
    /**
     * IResource
     */
    getUrl() {
        if (this.type === Resource.TYPE_RELATION) {
            // need to construct url here since owner.id is not present at construction time
            // since we are a relation resource, we can be sure that this.Model is set
            const ModelClass = this.Model;
            return `${this.relation.owner.type}/${this.relation.owner.id}/${ModelClass.type}{/id}`;
        }
        return this.url;
    }
    getListType() {
        return this.getItemType();
    }
    getListKey() {
        if (this.type === Resource.TYPE_RELATION) {
            return this.relation.listKey();
        }
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
    get(id) {
        if (!id) {
            return Promise.resolve(null);
        }
        return API.getItem({ resource: this, id }).then(model => {
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
        if (!id && this.relation.type === Relation.HAS_ONE) {
            id = this.relation.id;
        }
        return API.find({ resource: this, id });
    }
    findAll(params) {
        return API.findAll({ resource: this, params });
    }
    // Api Hooks
    registerRelation(model) {
        // register parent relations after item has been added to cache
        model.registerParentRelation(this.relation);
    }
    unregisterRelation(model) {
        // register parent relations after item has been added to cache
        model.unregisterParentRelation(this.relation);
    }
    itemAdded(model) {
        // reload all relations to this model
        model.getParentRelations().forEach(relation => {
            relation.reloadOnNextGet();
        });
    }
    itemDeleted(model) {
        // remove model from item cache
        API.purgeItem(this, model.id);
        // reload all relations to this model
        model.getParentRelations().forEach(relation => {
            relation.reloadOnNextGet();
        });
        // unregister all relations that link to this model
        for (const name of Object.keys(model.$rels)) {
            const relation = model.$rels[name];
            const relatedModels = relation.getRelatedModels();
            relatedModels.forEach(related => {
                related.unregisterParentRelation(relation);
            });
        }
    }
    itemSaved(_modelOld, _model) {
        // handle reload relations specific to model
    }
    itemAttached(_model) {
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
    }
    itemDetached(_model) {
        // reload relation the model is detached from
        this.relation.reloadOnNextGet();
    }
    /**
     * Convenient Resource Cache Access
     */
    cachePurgeList(type, key) {
        resourceCache.purgeList(type, key);
    }
    clone(relation) {
        const Constructor = this.constructor;
        const clone = new Constructor(this.type, relation || this._relation);
        clone.url = this.url;
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    }
    get relation() {
        return this._relation;
    }
    getItemModel(_json) {
        // hook into
        return this.Model;
    }
}
Resource.TYPE_RELATION = 'relation';
Resource.TYPE_MODEL = 'model';
Resource.TYPE_APP = 'app';
//# sourceMappingURL=Resource.js.map