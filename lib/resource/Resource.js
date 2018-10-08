import API from '../api/Api';
import LoadingState from '../api/LoadingState';
import ReverseRelations from '../lib/ReverseRelations';
import App from '../model/App';
import Relation from '../model/Relation';
var Resource = /** @class */ (function () {
    function Resource(resourceType, relation) {
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
    Resource.prototype.getUrl = function () {
        if (this.resourceType === Resource.TYPE_RELATION) {
            // need to construct url here since owner.id is not present at construction time
            // since we are a relation resource, we can be sure that this.Model is set
            // if you want a different url for your resource you need to override this method
            var relationType = this.relation.Model.type;
            return this.relation.owner.type + "/" + this.relation.owner.id + "/" + relationType + "{/id}";
        }
        return this.url;
    };
    Resource.prototype.getListType = function () {
        if (this.relation.Model) {
            return this.relation.Model.type;
        }
        throw new Error('The resource needs to implement the getListType() method');
    };
    Resource.prototype.getListKey = function () {
        if (this.resourceType === Resource.TYPE_RELATION) {
            return this.relation.listKey();
        }
        return {};
    };
    Resource.prototype.getDefaultListParams = function () {
        return {};
    };
    Resource.prototype.getItemType = function (json) {
        if (this.relation.Model) {
            return this.relation.Model.type;
        }
        if (json) {
            return this.getItemModel(json).type;
        }
        return 'models';
    };
    Resource.prototype.getItemJson = function (json) {
        return json;
    };
    Resource.prototype.createItem = function (json) {
        var ModelType;
        if (this.relation.Model) {
            ModelType = this.relation.Model;
        }
        else {
            ModelType = this.getItemModel(json);
        }
        var item = new ModelType();
        item.id = json.id;
        return item;
    };
    Resource.prototype.serializeAttachOrDetach = function (model) {
        return model.id;
    };
    Resource.prototype.serializeAttachOrDetachMany = function (models) {
        return models.map(function (model) { return ({
            type: model.type,
            id: model.id
        }); });
    };
    /**
     * IQuery
     */
    Resource.prototype.with = function () {
        var relations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            relations[_i] = arguments[_i];
        }
        var clone = this.clone();
        clone.relationsToFetch = relations;
        return clone;
    };
    Resource.prototype.get = function (id) {
        return this.getWithType(this.getItemType(), id);
    };
    Resource.prototype.getWithType = function (type, id) {
        var _this = this;
        if (!type || !id) {
            return Promise.resolve(null);
        }
        return API.getItem({ resource: this, type: type, id: id }).then(function (model) {
            if (model) {
                model.fetchRelationsAfterGet(_this.relationsToFetch);
            }
            return model;
        });
    };
    Resource.prototype.reloadAll = function (params) {
        var _this = this;
        if (params && params.ids) {
            params.ids.forEach(function (id) {
                var type = _this.getItemType();
                var model = API.find({ type: type, id: id });
                if (model) {
                    model.loadingState = LoadingState.NOT_LOADED;
                }
            });
        }
        else {
            this.relation.reloadOnNextGet();
        }
        return this.getAll(params);
    };
    Resource.prototype.getAll = function (params) {
        var _this = this;
        return API.getList({ resource: this, params: params }).then(function (models) {
            models.forEach(function (model) {
                model.fetchRelationsAfterGet(_this.relationsToFetch);
            });
            return models;
        });
    };
    Resource.prototype.save = function (model) {
        var action = model.id ? 'saveItem' : 'addItem';
        return API[action]({ resource: this, item: model });
    };
    Resource.prototype.updateAttributes = function (model, attributes) {
        return API.updateItemAttributes({ resource: this, item: model, attributes: attributes });
    };
    Resource.prototype.delete = function (model) {
        return API.deleteItem({ resource: this, item: model });
    };
    Resource.prototype.attach = function (model) {
        return API.attachItem({ resource: this, model: model });
    };
    Resource.prototype.attachMany = function (models) {
        return API.attachItems({ resource: this, models: models });
    };
    Resource.prototype.detach = function (model) {
        return API.detachItem({ resource: this, model: model });
    };
    Resource.prototype.find = function (type, id) {
        return API.find({ type: type, id: id });
    };
    Resource.prototype.findAll = function (params) {
        return API.findAll({ resource: this, params: params });
    };
    Resource.prototype.select = function (filterFunction) {
        return API.select({ resource: this, filterFunction: filterFunction });
    };
    Resource.prototype.findOwners = function (filterFunction) {
        return API.findOwners({ resource: this, filterFunction: filterFunction });
    };
    Resource.prototype.clone = function (relation) {
        var Constructor = this.constructor;
        var clone = new Constructor(this.resourceType, relation || this.relation);
        clone.url = this.url;
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    };
    /**
     * Api Hooks
     */
    Resource.prototype.itemLoaded = function (model) {
        this.registerRelation(model);
    };
    Resource.prototype.listLoaded = function (models, _params) {
        var _this = this;
        models.forEach(function (model) {
            _this.registerRelation(model);
        });
    };
    Resource.prototype.itemAdded = function (model) {
        // register relation with the model
        this.registerRelation(model);
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
        // invalidate new reverse relations to be established
        var relations = this.ensureReverseRelationsAfterAddOrSave(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAddOrDelete(model, 1);
    };
    Resource.prototype.itemDeleted = function (model) {
        // update all relations to this model
        model.getParentRelations().forEach(function (relation) {
            // reload relation
            relation.reloadOnNextGet();
            // unregister relation from model
            model.unregisterParentRelation(relation);
        });
        var _loop_1 = function (name_1) {
            var relation = model.$rels[name_1];
            var relatedModels = relation.getRelatedModels();
            relatedModels.forEach(function (relatedModel) {
                relatedModel.unregisterParentRelation(relation);
            });
        };
        // update relation registry of all models that
        // are linked by the deleted model
        for (var _i = 0, _a = Object.keys(model.$rels); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            _loop_1(name_1);
        }
        // invalidate obsolete reverse relations
        var relations = this.ensureReverseRelationsAfterAddOrSave(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAddOrDelete(model, -1);
    };
    Resource.prototype.itemSaved = function (modelOld, model) {
        // invalidate obsolete or new reverse relations to be established
        var oldRelations = this.ensureReverseRelationsAfterAddOrSave(modelOld);
        var newRelations = this.ensureReverseRelationsAfterAddOrSave(model);
        var relations = ReverseRelations.getDiff(oldRelations, newRelations);
        relations.reloadOnNextGet();
    };
    Resource.prototype.itemAttached = function (model) {
        this.registerRelation(model);
        // reload relation the model is attached to
        this.relation.reloadOnNextGet();
        // invalidate new reverse relations to be established
        var relations = this.ensureReverseRelationsAfterAttachOrDetach(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAttachOrDetach(model, 1);
    };
    Resource.prototype.itemsAttached = function (models) {
        var _this = this;
        var oldModels = this.relation.owner[this.relation.name] || [];
        oldModels.forEach(function (oldModel) {
            if (!models.includes(oldModel)) {
                _this.itemDetached(oldModel);
            }
        });
        models.forEach(function (model) {
            if (!oldModels.includes(model)) {
                _this.itemAttached(model);
            }
        });
    };
    Resource.prototype.itemDetached = function (model) {
        this.unregisterRelation(model);
        // reload relation the model is detached from
        this.relation.reloadOnNextGet();
        // invalidate obsolete reverse relations
        var relations = this.ensureReverseRelationsAfterAttachOrDetach(model);
        relations.reloadOnNextGet();
        this.setRelationCountsAfterAttachOrDetach(model, -1);
    };
    Resource.prototype.includedRelationInitialized = function (model, jsonLoadingState) {
        var loadingState = Math.max(jsonLoadingState, model.loadingState);
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
    };
    /**
     * Protected
     */
    Resource.prototype.getItemModel = function (_json) {
        throw new Error('The resource needs to implement the getItemModel() method');
    };
    Resource.prototype.ensureReverseRelationsAfterAttachOrDetach = function (model) {
        var ensure = new ReverseRelations();
        // check reverse of current relation
        var reverseName = this.getRelationReverseName(this.relation.owner, this.relation);
        if (reverseName) {
            ensure.add(model.$rels[reverseName]);
        }
        return ensure;
    };
    Resource.prototype.ensureReverseRelationsAfterAddOrSave = function (model) {
        var ensure = new ReverseRelations();
        var _loop_2 = function (name_2) {
            var relation = model.$rels[name_2];
            var reverseName = this_1.getRelationReverseName(model, relation);
            if (reverseName) {
                if (relation.type === Relation.HAS_ONE) {
                    ensure.add(model[relation.name].$rels[reverseName]);
                }
                else {
                    ensure.addMany(model[relation.name].map(function (m) { return m.$rels[reverseName]; }));
                }
            }
        };
        var this_1 = this;
        // check reverse relations of updated model
        for (var _i = 0, _a = Object.keys(model.$rels); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            _loop_2(name_2);
        }
        return ensure;
    };
    Resource.prototype.setRelationCountsAfterAttachOrDetach = function (model, diff) {
        // count attached
        if (this.relation.owner.hasOwnProperty('count_' + this.relation.name)) {
            this.relation.owner['count_' + this.relation.name] += diff;
            // console.log('set count', 'count_' + this.relation.name, this.relation.owner['count_' + this.relation.name], 'for', this.relation.owner.info)
        }
        // reverse count
        var reverseName = this.getRelationReverseName(this.relation.owner, this.relation);
        if (reverseName) {
            if (model.hasOwnProperty('count_' + reverseName)) {
                model['count_' + reverseName] += diff;
                // console.log('set count', 'count_' + reverseName, model['count_' + reverseName], 'for', model.info)
            }
        }
    };
    Resource.prototype.setRelationCountsAfterAddOrDelete = function (model, diff) {
        var _loop_3 = function (name_3) {
            var relation = model.$rels[name_3];
            var reverseName = this_2.getRelationReverseName(model, relation);
            if (reverseName) {
                var owners = [];
                if (relation.type === Relation.HAS_ONE) {
                    owners.push(model[relation.name]);
                }
                else {
                    owners = model[relation.name];
                }
                owners.forEach(function (owner) {
                    var relatedModel = owner.$rels[reverseName].Model;
                    if (relatedModel) {
                        if (relatedModel.type === model.type) {
                            if (owner.hasOwnProperty('count_' + reverseName)) {
                                owner['count_' + reverseName] += diff;
                                // console.log('set count', 'count_' + reverseName, owner['count_' + reverseName], 'for', owner.info)
                            }
                        }
                    }
                });
            }
        };
        var this_2 = this;
        // check reverse relations of updated model
        for (var _i = 0, _a = Object.keys(model.$rels); _i < _a.length; _i++) {
            var name_3 = _a[_i];
            _loop_3(name_3);
        }
    };
    Resource.prototype.getRelationReverseName = function (model, relation) {
        if (relation.reverseName instanceof Function) {
            return relation.reverseName(model);
        }
        return relation.reverseName || '';
    };
    Resource.prototype.registerRelation = function (model) {
        // register parent relations after item has been added to cache
        model.registerParentRelation(this.relation);
        // && console.log('register', this.relation.info, model.info, model.getParentRelations())
    };
    Resource.prototype.unregisterRelation = function (model) {
        // register parent relations after item has been added to cache
        model.unregisterParentRelation(this.relation);
        // && console.log('unregister', this.relation.info, model.info)
    };
    Resource.TYPE_RELATION = 'relation'; //
    Resource.TYPE_MODEL = 'model'; // orgas events
    Resource.TYPE_APP = 'app'; // search todos
    return Resource;
}());
export default Resource;
//# sourceMappingURL=Resource.js.map