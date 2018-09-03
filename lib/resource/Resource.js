import API from '../api/Api';
import LoadingState from '../api/LoadingState';
import ReverseRelations from '../lib/ReverseRelations';
import App from '../model/App';
import Relation from '../model/Relation';
export default class Resource {
    constructor(resourceType, relation) {
        this.url = '';
        this.lazyLoadList = false;
        this.relationsToFetch = [];
        this.resourceType = '';
        this.resourceType = resourceType || Resource.TYPE_APP;
        if (relation) {
            this.relation = relation;
        }
        else {
            this.relation = App.getRelationByType(this.getListType());
            if (!this.relation.Query) {
                this.relation.Query = this;
            }
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
    getDefaultListParams() {
        return {};
    }
    getItemType(json) {
        if (this.relation.Model) {
            return this.relation.Model.type;
        }
        if (json) {
            return this.getItemModel(json).type;
        }
        return 'models';
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
    updateAttributes(model, attributes) {
        return API.updateItemAttributes({ resource: this, item: model, attributes });
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
    select(filterFunction) {
        return API.select({ resource: this, filterFunction });
    }
    findOwners(filterFunction) {
        return API.findOwners({ resource: this, filterFunction });
    }
    clone(relation) {
        const Constructor = this.constructor;
        const clone = new Constructor(this.resourceType, relation || this.relation);
        clone.url = this.url;
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    }
    /**
     * Api Hooks
     */
    itemLoaded(model) {
        this.registerRelation(model);
    }
    listLoaded(models, _params) {
        models.forEach(model => {
            this.registerRelation(model);
        });
    }
    itemAdded(model) {
        // register relation with the model
        this.registerRelation(model);
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
        // invalidate new reverse relations to be established
        const relations = this.ensureReverseRelationsAfterAddOrSave(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAddOrDelete(model, 1);
    }
    itemDeleted(model) {
        // update all relations to this model
        model.getParentRelations().forEach(relation => {
            // reload relation
            relation.reloadOnNextGet();
            // unregister relation from model
            model.unregisterParentRelation(relation);
        });
        // update relation registry of all models that
        // are linked by the deleted model
        for (const name of Object.keys(model.$rels)) {
            const relation = model.$rels[name];
            const relatedModels = relation.getRelatedModels();
            relatedModels.forEach(relatedModel => {
                relatedModel.unregisterParentRelation(relation);
            });
        }
        // invalidate obsolete reverse relations
        const relations = this.ensureReverseRelationsAfterAddOrSave(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAddOrDelete(model, -1);
    }
    itemSaved(modelOld, model) {
        // invalidate obsolete or new reverse relations to be established
        const oldRelations = this.ensureReverseRelationsAfterAddOrSave(modelOld);
        const newRelations = this.ensureReverseRelationsAfterAddOrSave(model);
        const relations = ReverseRelations.getDiff(oldRelations, newRelations);
        relations.reloadOnNextGet();
    }
    itemAttached(model) {
        this.registerRelation(model);
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
        // invalidate new reverse relations to be established
        const relations = this.ensureReverseRelationsAfterAttachOrDetach(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAttachOrDetach(model, 1);
    }
    itemsAttached(models) {
        const oldModels = this.relation.owner[this.relation.name] || [];
        oldModels.forEach(oldModel => {
            if (!models.includes(oldModel)) {
                this.itemDetached(oldModel);
            }
        });
        models.forEach(model => {
            if (!oldModels.includes(model)) {
                this.itemAttached(model);
            }
        });
    }
    itemDetached(model) {
        this.unregisterRelation(model);
        // reload relation the model is detached from
        this.relation.reloadOnNextGet();
        // invalidate obsolete reverse relations
        const relations = this.ensureReverseRelationsAfterAttachOrDetach(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAttachOrDetach(model, -1);
    }
    includedRelationInitialized(models) {
        models.forEach(model => {
            const loadingState = model.calculateLoadingState();
            // if calculateLoadingState is not implemented it returns the
            // latest loading state of the model.
            // it model not yet loaded, assume list data
            if (loadingState === LoadingState.NOT_LOADED) {
                model.loadingState = LoadingState.LIST_DATA_LOADED;
                // set custom loading state
            }
            else {
                model.loadingState = loadingState;
            }
            this.registerRelation(model);
        });
    }
    /**
     * Protected
     */
    getItemModel(_json) {
        throw new Error('The resource needs to implement the getItemModel() method');
    }
    ensureReverseRelationsAfterAttachOrDetach(model) {
        const ensure = new ReverseRelations();
        // check reverse of current relation
        const reverseName = this.getRelationReverseName(this.relation.owner, this.relation);
        if (reverseName) {
            ensure.add(model.$rels[reverseName]);
        }
        return ensure;
    }
    ensureReverseRelationsAfterAddOrSave(model) {
        const ensure = new ReverseRelations();
        // check reverse relations of updated model
        for (const name of Object.keys(model.$rels)) {
            const relation = model.$rels[name];
            const reverseName = this.getRelationReverseName(model, relation);
            if (reverseName) {
                if (relation.type === Relation.HAS_ONE) {
                    ensure.add(model[relation.name].$rels[reverseName]);
                }
                else {
                    ensure.addMany(model[relation.name].map(m => m.$rels[reverseName]));
                }
            }
        }
        return ensure;
    }
    setRelationCountsAfterAttachOrDetach(model, diff) {
        // count attached
        if (this.relation.owner.hasOwnProperty('count_' + this.relation.name)) {
            this.relation.owner['count_' + this.relation.name] += diff;
            // console.log('set count', 'count_' + this.relation.name, this.relation.owner['count_' + this.relation.name], 'for', this.relation.owner.info)
        }
        // reverse count
        const reverseName = this.getRelationReverseName(this.relation.owner, this.relation);
        if (reverseName) {
            let countProperty = '';
            if (model.hasOwnProperty('count_' + reverseName)) {
                countProperty = reverseName;
            }
            else if (this.relation.owner.type && model.hasOwnProperty('count_' + this.relation.owner.type)) {
                countProperty = this.relation.owner.type;
            }
            if (countProperty) {
                model['count_' + countProperty] += diff;
                // console.log('set count', 'count_' + countProperty, model['count_' + countProperty], 'for', model.info)
            }
        }
    }
    setRelationCountsAfterAddOrDelete(model, diff) {
        // check reverse relations of updated model
        for (const name of Object.keys(model.$rels)) {
            const relation = model.$rels[name];
            const reverseName = this.getRelationReverseName(model, relation);
            if (reverseName) {
                let owners = [];
                if (relation.type === Relation.HAS_ONE) {
                    owners.push(model[relation.name]);
                }
                else {
                    owners = model[relation.name];
                }
                owners.forEach(owner => {
                    const relatedModel = owner.$rels[reverseName].Model;
                    if (relatedModel) {
                        if (relatedModel.type === model.type) {
                            let countProperty = '';
                            if (owner.hasOwnProperty('count_' + reverseName)) {
                                countProperty = reverseName;
                            }
                            else if (owner.hasOwnProperty('count_' + model.type)) {
                                countProperty = model.type;
                            }
                            if (countProperty) {
                                owner['count_' + countProperty] += diff;
                                // console.log('set count', 'count_' + countProperty, owner['count_' + countProperty], 'for', owner.info)
                            }
                        }
                    }
                });
            }
        }
    }
    getRelationReverseName(model, relation) {
        if (relation.reverseName instanceof Function) {
            return relation.reverseName(model);
        }
        return relation.reverseName || '';
    }
    registerRelation(model) {
        // register parent relations after item has been added to cache
        model.registerParentRelation(this.relation);
        // && console.log('register', this.relation.info, model.info, model.getParentRelations())
    }
    unregisterRelation(model) {
        // register parent relations after item has been added to cache
        model.unregisterParentRelation(this.relation);
        // && console.log('unregister', this.relation.info, model.info)
    }
}
Resource.TYPE_RELATION = 'relation'; //
Resource.TYPE_MODEL = 'model'; // orgas events
Resource.TYPE_APP = 'app'; // search todos
//# sourceMappingURL=Resource.js.map