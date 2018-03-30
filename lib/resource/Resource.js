import API from '../api/Api';
import resourceCache from '../cache/ResourceCache';
import App from '../model/App';
import Relation from '../model/Relation';
export default class Resource {
    constructor(resourceType, relation) {
        this.url = '';
        this.relationsToFetch = [];
        this.resourceType = '';
        this.resourceType = resourceType || Resource.TYPE_APP;
        if (relation) {
            this.relation = relation;
        }
        else {
            this.relation = App.getRelationByType(this.getListType());
        }
    }
    /**
     * IResource
     */
    getUrl() {
        if (this.resourceType === Resource.TYPE_RELATION) {
            // need to construct url here since owner.id is not present at construction time
            // since we are a relation resource, we can be sure that this.Model is set
            // if you want a different url for your resource you need to override this method
            const relationType = this.relation.Model.type;
            return `${this.relation.owner.type}/${this.relation.owner.id}/${relationType}{/id}`;
        }
        return this.url;
    }
    getListType() {
        if (this.relation.Model) {
            return this.relation.Model.type;
        }
        throw new Error('The resource needs to implement the getListType() method');
    }
    getListKey() {
        if (this.resourceType === Resource.TYPE_RELATION) {
            return this.relation.listKey();
        }
        return {};
    }
    getItemType(json) {
        if (this.relation.Model) {
            return this.relation.Model.type;
        }
        return this.getItemModel(json).type;
    }
    getItemJson(json) {
        return json;
    }
    createItem(json) {
        let ModelType;
        if (this.relation.Model) {
            ModelType = this.relation.Model;
        }
        else {
            ModelType = this.getItemModel(json);
        }
        const item = new ModelType();
        item.id = json.id;
        return item;
    }
    serializeAttachOrDetach(model) {
        return model.id;
    }
    serializeAttachOrDetachMany(models) {
        return models.map(model => ({
            type: model.type,
            id: model.id
        }));
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
        return API.attachItem({ resource: this, model });
    }
    attachMany(models) {
        return API.attachItems({ resource: this, models });
    }
    detach(model) {
        return API.detachItem({ resource: this, model });
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
    listLoaded(_models, _params) {
        // hook into
    }
    itemAdded(model) {
        // reload all relations to this model
        model.getParentRelations().forEach(relation => {
            relation.reloadOnNextGet();
        });
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
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
        // reload relation the model was attached to
        this.relation.reloadOnNextGet();
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
    cachePurgeItem(type, id) {
        resourceCache.purgeItem(type, id);
    }
    clone(relation) {
        const Constructor = this.constructor;
        const clone = new Constructor(this.resourceType, relation || this.relation);
        clone.url = this.url;
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    }
    getItemModel(_json) {
        throw new Error('The resource needs to implement the getItemModel() method');
    }
}
Resource.TYPE_RELATION = 'relation';
Resource.TYPE_MODEL = 'model';
Resource.TYPE_APP = 'app';
//# sourceMappingURL=Resource.js.map