"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
var LoadingState_1 = __importDefault(require("@src/api/LoadingState"));
var LoadingStrategy_1 = __importDefault(require("@src/api/LoadingStrategy"));
var ResourceCache_1 = __importDefault(require("@src/cache/ResourceCache"));
var ID = 0;
var Relation = /** @class */ (function () {
    function Relation(_a) {
        var owner = _a.owner, name = _a.name, type = _a.type, Model = _a.Model, associationType = _a.associationType;
        if (!type || !Model) {
            (_b = window.console).error.apply(_b, ['Relation configuration invalid'].concat(Array.from(arguments)));
        }
        if (!associationType) {
            associationType = Relation.ASSOCIATION_LINK;
        }
        this.owner = owner;
        this.name = name;
        this.type = type;
        this.Model = Model;
        this.associationType = associationType;
        this.instanceId = ++ID;
        this.isClone = false;
        this.original = null;
        this.reset();
        var _b;
    }
    Relation.prototype.purgeFromCacheAndMarkInvalid = function () {
        if (this.type === Relation.HAS_ONE) {
            if (this.id) {
                ResourceCache_1.default.purgeItem(this.Model.type, this.id);
            }
        }
        else {
            var listParams = JSON.stringify(this.listParams());
            ResourceCache_1.default.purgeList(this.Model.type, listParams);
        }
        this.isFetching = false;
        this.fetched = false;
        this.invalidated = true;
        if (this.original) {
            this.original.purgeFromCacheAndMarkInvalid();
        }
    };
    Relation.prototype.listParams = function () {
        return {
            owner_type: this.owner.type,
            owner_id: this.owner.id,
            relation: this.name
        };
    };
    Relation.prototype.deserialize = function (json) {
        var _this = this;
        this.reset();
        json = json.hasOwnProperty('data') ? json.data : json; // jsonapi-spec fallback
        // cache item
        if (this.type === Relation.HAS_ONE) {
            // if no json given -> related object === null
            if (json) {
                this.id = json.id;
                this.findOrCreateItem(json);
            }
            // cache list
        }
        else {
            var items_1 = [];
            json.forEach(function (itemJson) {
                var item = _this.findOrCreateItem(itemJson);
                items_1.push(item);
            });
            var listParams = JSON.stringify(this.listParams());
            ResourceCache_1.default.addList(this.Model.type, listParams, items_1);
        }
        this.hasIncludedData = true;
    };
    Relation.prototype.fetchHasOne = function (callback, currentItemState, fetchingStrategy) {
        var _this = this;
        if (this.fetched) {
            // fetch again if we want do fully load but havent yet
            var wantToFetchMore = fetchingStrategy === LoadingStrategy_1.default.LOAD_IF_NOT_FULLY_LOADED &&
                currentItemState < LoadingState_1.default.FULLY_LOADED;
            if (!wantToFetchMore) {
                return;
            }
        }
        if (this.isFetching) {
            // fetch additionally if we want to fetch more detailed data
            var wantToFetchMore = fetchingStrategy === LoadingStrategy_1.default.LOAD_IF_NOT_FULLY_LOADED &&
                this.isFetching !== fetchingStrategy;
            if (!wantToFetchMore) {
                return;
            }
        }
        this.isFetching = fetchingStrategy;
        callback(this.id).then(function () {
            _this.isFetching = false;
            _this.fetched = true;
            _this.invalidated = false;
        });
    };
    Relation.prototype.fetchHasMany = function (callback) {
        var _this = this;
        if (this.fetched) {
            return;
        }
        if (this.isFetching) {
            return;
        }
        this.isFetching = true;
        callback().then(function () {
            _this.isFetching = false;
            _this.fetched = true;
            _this.invalidated = false;
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
    Relation.prototype.clone = function () {
        var clone = new Relation({
            owner: this.owner,
            name: this.name,
            type: this.type,
            Model: this.Model,
            associationType: this.associationType
        });
        clone.id = this.id;
        clone.hasIncludedData = this.hasIncludedData;
        clone.isClone = true;
        clone.original = this;
        return clone;
    };
    Object.defineProperty(Relation.prototype, "info", {
        get: function () {
            var isClone = this.isClone ? '(CLONE)' : '';
            var itemId = this.type === Relation.HAS_ONE ? "itemId=\"" + this.id + "\" " : '';
            return "[Relation] id=\"" + this.instanceId + isClone + "\"\n      owner=\"" + this.owner.type + "(" + this.owner.id + ")\"\n      type=\"" + this.type + "\" name=\"" + this.name + "\" " +
                (itemId + "hasIncludedData=\"" + this.hasIncludedData + "\"\n      fetched=\"" + this.fetched + "\"\n      invalidated=\"" + this.invalidated + "\"");
        },
        enumerable: true,
        configurable: true
    });
    Relation.prototype.findOrCreateItem = function (json) {
        var item = ResourceCache_1.default.getItem(this.Model.type, json.id);
        if (!item) {
            item = new this.Model();
            item.id = json.id;
            ResourceCache_1.default.addItem(this.Model.type, item);
        }
        item.deserialize(json);
        return item;
    };
    Relation.prototype.reset = function () {
        // id of a has_one relation, may be accompanied by json data but does not need to
        this.id = null;
        // avoid recursions, if a relation has been cached,
        // there is no need to cache its data again,
        // even if we clone the item that holds the relation
        this.hasIncludedData = false;
        this.isFetching = false;
        this.fetched = false;
        this.invalidated = false;
    };
    Relation.HAS_ONE = 'has_one';
    Relation.HAS_MANY = 'has_many';
    Relation.ASSOCIATION_COMPOSITION = 'composition';
    Relation.ASSOCIATION_LINK = 'link';
    return Relation;
}());
exports.default = Relation;
//# sourceMappingURL=Relation.js.map