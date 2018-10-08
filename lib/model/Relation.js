import API from '../api/Api';
var ID = 0;
var Relation = /** @class */ (function () {
    function Relation(_a) {
        var owner = _a.owner, name = _a.name, reverseName = _a.reverseName, type = _a.type, Model = _a.Model;
        this.fetched = false;
        this.invalidated = false;
        this.id = null;
        this.itemType = null;
        this._Query = null;
        if (!type) {
            console.error.apply(console, ['Relation configuration invalid'].concat(Array.from(arguments)));
        }
        this.owner = owner;
        this.name = name;
        this.reverseName = reverseName || null;
        this.type = type;
        this.Model = Model || null;
        this.instanceId = ++ID;
        this.isClone = false;
        this.original = null;
        this.reset();
    }
    Object.defineProperty(Relation.prototype, "Query", {
        get: function () {
            return this._Query;
        },
        set: function (query) {
            this._Query = query;
        },
        enumerable: true,
        configurable: true
    });
    Relation.prototype.reloadOnNextGet = function () {
        if (!this.fetched) { // not fetched yet
            return;
        }
        if (this.invalidated) { // already invalidated
            return;
        }
        if (this.original) {
            this.original.reloadOnNextGet();
            return;
        }
        console.log('Relation.reloadOnNextGet', this.info);
        if (this.type === Relation.HAS_ONE) {
            API.purgeItem(this.itemType, this.id);
        }
        else {
            API.purgeList(this.resource);
        }
        this.fetched = false;
        this.invalidated = true;
    };
    Relation.prototype.getRelatedModels = function () {
        if (this.type === Relation.HAS_ONE) {
            var model = this.owner[this.name];
            if (model) {
                return [model];
            }
        }
        else {
            return this.owner[this.name];
        }
        return [];
    };
    Relation.prototype.listKey = function () {
        return {
            owner_type: this.owner.type,
            owner_id: this.owner.id,
            relation: this.name
        };
    };
    Relation.prototype.deserialize = function (json) {
        var _this = this;
        this.reset();
        // { data: null } is valid
        json = json && json.hasOwnProperty('data') ? json.data : json; // jsonapi-spec fallback
        // cache item
        if (this.type === Relation.HAS_ONE) {
            // if no json given -> related object === null
            if (json) {
                return API.pushItem({ resource: this.resource, json: json }).then(function (item) {
                    // store the id
                    _this.id = item.id;
                    _this.itemType = item.type;
                    var loadingState = item.calculateLoadingState(json);
                    // track new relation
                    _this.resource.includedRelationInitialized(item, loadingState);
                });
            }
            else {
                // reset id to null
                this.id = null;
                this.itemType = null;
                return Promise.resolve();
            }
            // cache list
        }
        else {
            return API.pushList({ resource: this.resource, json: json, params: {} }).then(function (items) {
                if (items.length) {
                    var loadingState_1 = items[0].calculateLoadingState(json[0]);
                    // track new relation
                    items.forEach(function (item) {
                        _this.resource.includedRelationInitialized(item, loadingState_1);
                    });
                }
            });
        }
    };
    Relation.prototype.refetch = function () {
        return this.fetch(false, true);
    };
    Relation.prototype.fetch = function (clone, forceLoading) {
        var _this = this;
        if (this.fetched) {
            return Promise.resolve(true);
        }
        var promise;
        if (this.type === Relation.HAS_ONE) {
            promise = (forceLoading ? this.getHasOne() : this.findHasOne()).then(function (model) {
                if (model && clone) {
                    model = model.clone();
                }
                return model;
            });
        }
        else {
            promise = (forceLoading ? this.getHasMany() : this.findHasMany()).then(function (items) {
                var models = [];
                items.forEach(function (item) {
                    if (item && clone) {
                        item = item.clone();
                    }
                    models.push(item);
                });
                return models;
            });
        }
        return promise.then(function (result) {
            _this.fetched = true;
            _this.invalidated = false;
            _this.owner.onRelationFetched(_this, result);
        });
    };
    /**
     * A cloned item will also have all relations cloned from it's orginal.
     * The clone item must fetch any relation on its own and hence runs its
     * own process of collecting data - fully independent from the original.
     *
     * In order to fetch the necessary resources of the original, we need to
     * copy initial data json/id as well as (for performance reasons) the
     * hint, if the relation data has already been synced to the resource cache.
     */
    Relation.prototype.clone = function (owner) {
        var clone = new Relation({
            owner: owner,
            name: this.name,
            reverseName: this.reverseName || undefined,
            type: this.type,
            Model: this.Model || undefined
        });
        clone.id = this.id;
        clone.itemType = this.itemType;
        clone.isClone = true;
        clone.original = this;
        // clone resource with our cloned relation
        clone.Query = this.Query.clone(clone);
        return clone;
    };
    Object.defineProperty(Relation.prototype, "info", {
        get: function () {
            var isClone = this.isClone ? '(CLONE)' : '';
            var itemId = this.type === Relation.HAS_ONE ? "itemId=\"" + this.id + "\" itemType=\"" + this.itemType + "\" " : '';
            return "[Relation] id=\"" + this.instanceId + isClone + "\" owner=\"" + this.owner.type + "(" + this.owner.id + ")\" type=\"" + this.type + "\" name=\"" + this.name + "\" " +
                (itemId + "fetched=\"" + this.fetched + "\" invalidated=\"" + this.invalidated + "\"");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Relation.prototype, "resource", {
        get: function () {
            return this._Query;
        },
        enumerable: true,
        configurable: true
    });
    Relation.prototype.findHasOne = function () {
        var type = this.itemType || (this.Model && this.Model.type);
        return Promise.resolve(this.Query.find(type, this.id));
    };
    Relation.prototype.getHasOne = function () {
        var type = this.itemType || (this.Model && this.Model.type);
        return this.Query.getWithType(type, this.id);
    };
    Relation.prototype.findHasMany = function () {
        return Promise.resolve(this.Query.findAll(this.resource.getDefaultListParams()));
    };
    Relation.prototype.getHasMany = function () {
        return this.Query.getAll();
    };
    Relation.prototype.reset = function () {
        // id of a has_one relation, may be accompanied by json data but does not need to
        this.id = null;
        this.itemType = null;
        this.fetched = false;
        this.invalidated = false;
    };
    Relation.HAS_ONE = 'has_one';
    Relation.HAS_MANY = 'has_many';
    return Relation;
}());
export default Relation;
//# sourceMappingURL=Relation.js.map