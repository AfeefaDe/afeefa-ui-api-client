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
import Relation from './Relation';
let ID = 0;
export default class Model {
    constructor() {
        this.id = null;
        this.type = null;
        this.$rels = {};
        this._loadingState = LoadingState.NOT_FULLY_LOADED;
        this._ID = ++ID;
        this._requestId = 0;
        this._isClone = false;
        this._original = null;
        this._lastSnapshot = '';
        this._parentRelations = new Set();
        this._numDeserializedAttributes = 0;
        // init attributes
        for (const name of Object.keys(this.class._attributes)) {
            const attr = this.class._attributes[name];
            this[name] = attr.hasOwnProperty('default') ? attr.default : attr.type.value();
        }
        this.type = this.class.type;
        // init relations
        for (const relationName of Object.keys(this.class._relations)) {
            const relationConfig = this.class._relations[relationName];
            this[relationName] = relationConfig.type === Relation.HAS_MANY ? [] : null;
            const { remoteName, Resource: ResourceType } = relationConfig, relationParams = __rest(relationConfig, ["remoteName", "Resource"]); // splice remoteName and Resource
            const relation = new Relation(Object.assign({ owner: this, name: relationName }, relationParams));
            if (!relation.Model) {
                throw new Error('You need to specify a Model for a Relation');
            }
            // create resource from config (resource or relation resourse)
            if (ResourceType) {
                relation.Query = new ResourceType(Resource.TYPE_RELATION, relation);
                // create a default resource
            }
            else {
                // reuse existing model resource for has one relations
                if (relation.type === Relation.HAS_ONE) {
                    if (!relation.Model.Query) {
                        throw new Error('Using a Model in a Relation requires a Resource to be defined for that Model');
                    }
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
    static relations() {
        return {};
    }
    static attributes() {
        return {
            id: DataTypes.String,
            type: DataTypes.String
        };
    }
    /**
     * Relations
     */
    fetchRelationsAfterGet(relationsToFullyFetch = []) {
        for (const relationName of Object.keys(this.$rels)) {
            const relation = this.$rels[relationName];
            if (relationsToFullyFetch.includes(relationName)) {
                relation.fetched = false;
                relation.fetch(false, true);
            }
            else if (relation.invalidated) {
                relation.fetch(false, true);
            }
        }
    }
    registerParentRelation(relation) {
        // console.log('register parent', this._ID, this.type, this.id, relation.info)
        this._parentRelations.add(relation);
    }
    getParentRelations() {
        return this._parentRelations;
    }
    unregisterParentRelation(relation) {
        // console.log('unregister parent', this._ID, this.type, this.id, relation.info)
        this._parentRelations.delete(relation);
    }
    /**
     * Serialization
     */
    deserialize(json, requestId) {
        const numDeserializedAttributes = this.countJsonKeys(json);
        const isSameRequest = requestId === this._requestId;
        if (isSameRequest && numDeserializedAttributes <= this._numDeserializedAttributes) {
            return Promise.resolve(true);
        }
        this._requestId = requestId;
        this._numDeserializedAttributes = numDeserializedAttributes;
        this.id = json.id;
        json = this.beforeDeserialize(json);
        this.deserializeAttributes(json.attributes || json);
        this.afterDeserializeAttributes();
        this.deserializeRelations(json.relationships || json);
        return this.fetchAllIncludedRelations();
    }
    toJson() {
        return this.serialize();
    }
    serialize() {
        // default serialization
        const data = {
            id: this.id,
            type: this.type
        };
        return data;
    }
    hasChanges() {
        if (this._original) {
            if (!this._lastSnapshot) {
                this._lastSnapshot = JSON.stringify(this._original.serialize());
            }
            const json = JSON.stringify(this.serialize());
            return this._lastSnapshot !== json;
        }
        return false;
    }
    markSaved() {
        this._lastSnapshot = JSON.stringify(this.serialize());
    }
    clone() {
        return this.cloneWith();
    }
    cloneWith(...relations) {
        const clone = this._clone(this);
        clone._isClone = true;
        clone._original = this;
        clone._requestId = this._requestId;
        clone._loadingState = this._loadingState;
        clone._parentRelations = this._parentRelations;
        for (const relationName of Object.keys(this.$rels)) {
            clone.$rels[relationName] = this.$rels[relationName].clone(clone);
        }
        clone.fetchAllIncludedRelations(relations);
        return clone;
    }
    get info() {
        const isClone = this._isClone ? '(CLONE)' : '';
        return `[${this.class.name}] id="${this.id}" ID="${this._ID}${isClone}" request="${this._requestId}"`;
    }
    onRelationFetched(relation, data) {
        this[relation.name] = data;
        const fetchHook = 'on' + toCamelCase(relation.name);
        this[fetchHook] && this[fetchHook](data);
    }
    init() {
        // pls override
    }
    beforeDeserialize(json) {
        return json;
    }
    afterDeserializeAttributes() {
        // hook into
    }
    countJsonKeys(json, level = 0) {
        let numKeys = 0;
        if (level < 3 && json && typeof json === 'object') {
            for (const key of Object.keys(json)) {
                numKeys = numKeys + 1 + this.countJsonKeys(json[key], level + 1);
            }
        }
        return numKeys;
    }
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    _clone(value) {
        if (value instanceof Model) {
            const model = value;
            const Constructor = model.class;
            const clone = new Constructor();
            for (const key of Object.keys(model)) {
                const keyVal = model[key];
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
            const array = value;
            const clone = [];
            for (const arrVal of array) {
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
            const obj = value;
            const clone = {};
            for (const key of Object.keys(obj)) {
                const keyVal = obj[key];
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
    }
    get class() {
        return this.constructor;
    }
    hasAttr(name) {
        return !!this.class._attributes[name];
    }
    getAttrValue(name, value) {
        const attr = this.class._attributes[name];
        // return custom value calclulation or the default calculation of the type
        return attr.value ? attr.value(value) : attr.type.value(value);
    }
    hasRelation(name) {
        return !!this.class._relations[name];
    }
    fetchAllIncludedRelations(relationsToClone = []) {
        // fetch all included relations before return from Model.deserialize
        // that's why we put all fetch request into the promise bag
        const promises = [];
        for (const relationName of Object.keys(this.$rels)) {
            const relation = this.$rels[relationName];
            const clone = relationsToClone.includes(relationName);
            promises.push(relation.fetch(clone, false));
        }
        return Promise.all(promises);
    }
    deserializeAttributes(attributesJson) {
        if (!attributesJson) {
            return;
        }
        for (const name of Object.keys(attributesJson)) {
            const localName = this.class._attributeRemoteNameMap[name] || name;
            if (this.hasAttr(localName)) {
                this[localName] = this.getAttrValue(localName, attributesJson[name]);
            }
        }
    }
    deserializeRelations(relationsJson) {
        if (!relationsJson) {
            return;
        }
        for (const name of Object.keys(relationsJson)) {
            const localName = this.class._relationRemoteNameMap[name] || name;
            if (this.hasRelation(localName)) {
                const relation = this.$rels[localName];
                relation.deserialize(relationsJson[name]);
            }
        }
    }
}
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
], Model.prototype, "_loadingState", void 0);
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
//# sourceMappingURL=Model.js.map