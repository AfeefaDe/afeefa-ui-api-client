var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
import LoadingState from '../api/LoadingState';
import { enumerable } from '../decorator/enumerable';
import toCamelCase from '../filter/camel-case';
import Resource from '../resource/Resource';
import DataTypes from './DataTypes';
import PlainJson from './PlainJson';
import Relation from './Relation';
var ID = 0;
var Model = /** @class */ (function () {
    function Model() {
        this.id = null;
        this.type = null;
        this.loadingState = LoadingState.NOT_LOADED;
        this.$rels = {};
        this._ID = ++ID;
        this._requestId = 0;
        this._isClone = false;
        this._original = null;
        this._lastSnapshot = '';
        this._parentRelations = new Set();
        this._numDeserializedAttributes = 0;
        // init attributes
        for (var _i = 0, _a = Object.keys(this.class._attributes); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var attr = this.class._attributes[name_1];
            this[name_1] = attr.hasOwnProperty('default') ? attr.default : attr.type.value();
        }
        this.type = this.class.type;
        // init relations
        for (var _b = 0, _c = Object.keys(this.class._relations); _b < _c.length; _b++) {
            var relationName = _c[_b];
            var relationConfig = this.class._relations[relationName];
            this[relationName] = relationConfig.type === Relation.HAS_MANY ? [] : null;
            var remoteName = relationConfig.remoteName, ResourceType = relationConfig.Resource, relationParams = __rest(relationConfig, ["remoteName", "Resource"]); // splice remoteName and Resource
            var relation = new Relation(__assign({ owner: this, name: relationName }, relationParams));
            // create resource from config (resource or relation resourse)
            if (ResourceType) {
                relation.Query = new ResourceType(Resource.TYPE_RELATION, relation);
                // create a default resource
            }
            else {
                // reuse existing model resource for has one relations
                if (relation.type === Relation.HAS_ONE && relation.Model && relation.Model.Query) {
                    // clone model resource with our relation
                    relation.Query = relation.Model.Query.clone(relation);
                    // create a default relation resource
                }
                else {
                    relation.Query = new Resource(Resource.TYPE_RELATION, relation);
                }
            }
            this.$rels[relationName] = relation;
        }
        this.init();
    }
    Model.relations = function () {
        return {};
    };
    Model.attributes = function () {
        return {
            id: DataTypes.String,
            type: DataTypes.String
        };
    };
    /**
     * Relations
     */
    Model.prototype.fetchRelationsAfterGet = function (relationsToFullyFetch) {
        if (relationsToFullyFetch === void 0) { relationsToFullyFetch = []; }
        for (var _i = 0, _a = Object.keys(this.$rels); _i < _a.length; _i++) {
            var relationName = _a[_i];
            var relation = this.$rels[relationName];
            if (relationsToFullyFetch.includes(relationName)) {
                relation.fetched = false;
                // tslint:disable-next-line no-floating-promises
                relation.fetch(false, true);
            }
            else if (relation.invalidated) {
                // tslint:disable-next-line no-floating-promises
                relation.fetch(false, true);
            }
        }
    };
    Model.prototype.registerParentRelation = function (relation) {
        if (this._parentRelations.has(relation)) {
            return false;
        }
        // console.log('register parent', this._ID, this.type, this.id, relation.info)
        this._parentRelations.add(relation);
        return true;
    };
    Model.prototype.getParentRelations = function () {
        return this._parentRelations;
    };
    Model.prototype.unregisterParentRelation = function (relation) {
        if (this._parentRelations.has(relation)) {
            // console.log('unregister parent', this._ID, this.type, this.id, relation.info)
            this._parentRelations.delete(relation);
            return true;
        }
        return false;
    };
    /**
     * Serialization
     */
    Model.prototype.deserialize = function (json, requestId) {
        var _this = this;
        var numDeserializedAttributes = this.countJsonKeys(json);
        var isSameRequest = requestId === this._requestId;
        if (isSameRequest && numDeserializedAttributes <= this._numDeserializedAttributes) {
            return Promise.resolve(true);
        }
        this._requestId = requestId;
        this._numDeserializedAttributes = numDeserializedAttributes;
        this.id = json.id;
        json = this.beforeDeserialize(json);
        this.deserializeAttributes(json.attributes || json);
        this.afterDeserializeAttributes();
        this.guessHasOneRelationKeys(json.attributes || json, json.relationships || json);
        // console.log('--'.repeat(Model.LEVEL), this.info)
        Model.LEVEL++;
        return this.deserializeRelations(json.relationships || json).then(function (deserializedRelations) {
            return _this.fetchRelations(deserializedRelations).then(function () {
                Model.LEVEL--;
                _this.afterDeserialize();
            });
        });
    };
    Model.prototype.toJson = function () {
        return this.serialize();
    };
    Model.prototype.attributesToJson = function (attributes) {
        return {
            id: this.id,
            type: this.type,
            attributes: attributes
        };
    };
    Model.prototype.serialize = function () {
        // default serialization
        var data = {
            id: this.id,
            type: this.type
        };
        return data;
    };
    Model.prototype.hasChanges = function () {
        if (this._original) {
            if (!this._lastSnapshot) {
                this._lastSnapshot = JSON.stringify(this._original.serialize());
            }
            var json = JSON.stringify(this.serialize());
            return this._lastSnapshot !== json;
        }
        return false;
    };
    Model.prototype.markSaved = function () {
        this._lastSnapshot = JSON.stringify(this.serialize());
    };
    Model.prototype.clone = function () {
        return this.cloneWith();
    };
    Model.prototype.cloneWith = function () {
        var relationsToClone = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            relationsToClone[_i] = arguments[_i];
        }
        var clone = this._clone(this);
        clone._isClone = true;
        clone._original = this;
        clone._requestId = this._requestId;
        clone.loadingState = this.loadingState;
        clone._parentRelations = this._parentRelations;
        for (var _a = 0, _b = Object.keys(this.$rels); _a < _b.length; _a++) {
            var relationName = _b[_a];
            clone.$rels[relationName] = this.$rels[relationName].clone(clone);
        }
        clone.fetchAllRelations(relationsToClone);
        return clone;
    };
    Object.defineProperty(Model.prototype, "info", {
        get: function () {
            var isClone = this._isClone ? '(CLONE)' : '';
            return "[" + this.class.name + "] id=\"" + this.id + "\" ID=\"" + this._ID + isClone + "\" request=\"" + this._requestId + "\" loading=\"" + this.loadingState + "\"";
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.onRelationFetched = function (relation, data) {
        this[relation.name] = data;
        // set counts
        if (Array.isArray(data)) {
            if (this.hasOwnProperty('count_' + relation.name)) {
                this['count_' + relation.name] = data.length;
                // console.log('set count', 'count_' + relation.name, data.length, 'for', this.info)
            }
        }
        // hook after fetched
        var fetchHook = 'on' + toCamelCase(relation.name);
        this[fetchHook] && this[fetchHook](data);
    };
    Object.defineProperty(Model.prototype, "hasListData", {
        get: function () {
            return this.loadingState >= LoadingState.LIST_DATA_LOADED;
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.calculateLoadingState = function (_json) {
        return this.loadingState;
    };
    Model.prototype.init = function () {
        // pls override
    };
    Model.prototype.beforeDeserialize = function (json) {
        return json;
    };
    Model.prototype.afterDeserializeAttributes = function () {
        // hook into
    };
    Model.prototype.afterDeserialize = function () {
        // hook into
    };
    Model.prototype.guessHasOneRelationKeys = function (attibutesJson, relationsJson) {
        for (var _i = 0, _a = Object.keys(this.$rels); _i < _a.length; _i++) {
            var relationName = _a[_i];
            var relation = this.$rels[relationName];
            if (!relationsJson.hasOwnProperty('relationName') && relation.type === Relation.HAS_ONE) {
                if (attibutesJson.hasOwnProperty(relationName + '_id')) {
                    var id = attibutesJson[relationName + '_id'];
                    relationsJson[relationName] = id ? {
                        id: attibutesJson[relationName + '_id']
                    } : null;
                }
            }
        }
    };
    Model.prototype.countJsonKeys = function (json, level) {
        if (level === void 0) { level = 0; }
        var numKeys = 0;
        if (level < 3 && json && typeof json === 'object') {
            for (var _i = 0, _a = Object.keys(json); _i < _a.length; _i++) {
                var key = _a[_i];
                numKeys = numKeys + 1 + this.countJsonKeys(json[key], level + 1);
            }
        }
        return numKeys;
    };
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    Model.prototype._clone = function (value) {
        if (value instanceof Model) {
            var model = value;
            var Constructor = model.class;
            var clone = new Constructor();
            for (var _i = 0, _a = Object.keys(model); _i < _a.length; _i++) {
                var key = _a[_i];
                var keyVal = model[key];
                // set model associations to null, let the clone fetch the relation
                if (keyVal instanceof Model) {
                    clone[key] = null;
                    continue;
                }
                clone[key] = this._clone(keyVal);
            }
            return clone;
        }
        if (Array.isArray(value)) {
            var array = value;
            var clone = [];
            for (var _b = 0, array_1 = array; _b < array_1.length; _b++) {
                var arrVal = array_1[_b];
                if (arrVal instanceof Model) {
                    // do not clone associations
                    continue;
                }
                clone.push(this._clone(arrVal));
            }
            return clone;
        }
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        if (value !== null && typeof value === 'object') {
            var obj = value;
            var clone = {};
            for (var _c = 0, _d = Object.keys(obj); _c < _d.length; _c++) {
                var key = _d[_c];
                var keyVal = obj[key];
                // set model associations to null, let the clone fetch the relation
                if (keyVal instanceof Model) {
                    clone[key] = null;
                    continue;
                }
                clone[key] = this._clone(keyVal);
            }
            return clone;
        }
        return value;
    };
    Object.defineProperty(Model.prototype, "class", {
        get: function () {
            return this.constructor;
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.hasAttr = function (name) {
        return !!this.class._attributes[name];
    };
    Model.prototype.getAttrValue = function (name, value) {
        var attr = this.class._attributes[name];
        // return custom value calclulation or the default calculation of the type
        return attr.value ? attr.value(value) : attr.type.value(value);
    };
    Model.prototype.hasRelation = function (name) {
        return !!this.class._relations[name];
    };
    Model.prototype.fetchAllRelations = function (relationsToClone) {
        if (relationsToClone === void 0) { relationsToClone = []; }
        for (var _i = 0, _a = Object.keys(this.$rels); _i < _a.length; _i++) {
            var relationName = _a[_i];
            var relation = this.$rels[relationName];
            var clone = relationsToClone.includes(relationName);
            // tslint:disable-next-line no-floating-promises
            relation.fetch(clone, false);
        }
    };
    Model.prototype.fetchRelations = function (relationsToFetch) {
        // fetch all included relations before return from Model.deserialize
        // that's why we put all fetch request into the promise bag
        var promises = [];
        for (var _i = 0, _a = Object.keys(this.$rels); _i < _a.length; _i++) {
            var relationName = _a[_i];
            if (relationsToFetch.includes(relationName)) {
                var relation = this.$rels[relationName];
                promises.push(relation.fetch(false, false));
            }
        }
        return Promise.all(promises);
    };
    Model.prototype.deserializeAttributes = function (attributesJson) {
        if (!attributesJson) {
            return;
        }
        for (var _i = 0, _a = Object.keys(attributesJson); _i < _a.length; _i++) {
            var name_2 = _a[_i];
            var localName = this.class._attributeRemoteNameMap[name_2] || name_2;
            if (this.hasAttr(localName)) {
                this[localName] = this.getAttrValue(localName, attributesJson[name_2]);
                if (localName.match(/count_/)) {
                    // console.log('set count attribute:', localName, this[localName], 'for', this.info)
                }
            }
        }
    };
    Model.prototype.deserializeRelations = function (relationsJson) {
        var deserializedRelations = [];
        var promise = Promise.resolve();
        if (relationsJson) {
            var _loop_1 = function (name_3) {
                var localName = this_1.class._relationRemoteNameMap[name_3] || name_3;
                if (this_1.hasRelation(localName)) {
                    var relation_1 = this_1.$rels[localName];
                    // if we just have a plain json relation we want to
                    // assign to our model
                    if (relation_1.Model && relation_1.Model === PlainJson) {
                        this_1[localName] = relationsJson[name_3].data || relationsJson[name_3]; // jsonapi spec fallback
                        return "continue";
                    }
                    else {
                        promise = promise.then(function () {
                            return relation_1.deserialize(relationsJson[name_3]).then(function () {
                                deserializedRelations.push(localName);
                            });
                        });
                    }
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = Object.keys(relationsJson); _i < _a.length; _i++) {
                var name_3 = _a[_i];
                _loop_1(name_3);
            }
        }
        return promise.then(function () {
            return deserializedRelations;
        });
    };
    Model.LEVEL = 0;
    Model.type = 'models';
    Model.Resource = null;
    Model.ResourceUrl = null;
    Model._relations = {};
    Model._attributes = {};
    Model._attributeRemoteNameMap = {};
    Model._relationRemoteNameMap = {};
    __decorate([
        enumerable(false)
    ], Model.prototype, "$rels", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_ID", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_requestId", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_isClone", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_original", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_lastSnapshot", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_parentRelations", void 0);
    __decorate([
        enumerable(false)
    ], Model.prototype, "_numDeserializedAttributes", void 0);
    return Model;
}());
export default Model;
//# sourceMappingURL=Model.js.map