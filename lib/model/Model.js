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
import LoadingStrategy from '../api/LoadingStrategy';
import { enumerable } from '../decorator/enumerable';
import toCamelCase from '../filter/camel-case';
import RelationResource from '../resource/RelationResource';
import DataTypes from './DataTypes';
import ModelRegistry from './Registry';
import Relation from './Relation';
let ID = 0;
export default class Model {
    constructor() {
        this.id = null;
        this.type = null;
        this.$rels = {};
        this._loadingState = LoadingState.NOT_LOADED;
        this._ID = ++ID;
        this._requestId = 0;
        this._isClone = false;
        this._original = null;
        this._lastSnapshot = '';
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
            const { remoteName, Resource: ResourceType } = relationConfig, relationParams = __rest(relationConfig, ["remoteName", "Resource"]); // splice remoteName
            const relation = new Relation(Object.assign({ owner: this, name: relationName }, relationParams));
            if (ResourceType) {
                if (ResourceType.prototype instanceof RelationResource) {
                    relation.Query = new ResourceType(relation);
                }
                else {
                    relation.Query = new ResourceType(relation.Model);
                }
            }
            else {
                if (relation.type === Relation.HAS_ONE) {
                    relation.Query = relation.Model.Query;
                }
                else {
                    relation.Query = new RelationResource(relation);
                }
            }
            this.$rels[relationName] = relation;
        }
        this.init();
    }
    static register(ModelType) {
        return ModelRegistry.register(ModelType);
    }
    static initializeAll() {
        return ModelRegistry.initializeAll();
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
                this.fetchRelation(relationName, false, LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED);
            }
            else if (relation.invalidated) {
                console.log('fetchRelationsAfterGet', this.info, relationName, this.$rels[relationName].info);
                this.fetchRelation(relationName, false);
            }
        }
    }
    refetchRelation(relationName) {
        const relation = this.$rels[relationName];
        relation.fetched = false;
        this.fetchRelation(relationName, false);
    }
    /**
     * Serialization
     */
    deserialize(json) {
        if (json._requestId === undefined) {
            console.error('No requestId given in json. Might be an error in normalizeJson()', this.info, json);
        }
        // do not deserialize if we do not have any attribute or relation data
        const jsonLoadingState = this.calculateLoadingStateFromJson(json);
        if (!jsonLoadingState) {
            return;
        }
        // we do not want to deserialize our model multiple times in the same request
        // unless we really have more data (e.g. first loaded as attributes, later got list data)
        const isSameRequest = json._requestId === this._requestId;
        const wantToDeserializeMore = jsonLoadingState > this._loadingState;
        if (isSameRequest && !wantToDeserializeMore) {
            return;
        }
        this.id = json.id;
        this._requestId = json._requestId;
        this._loadingState = Math.max(this._loadingState, this.calculateLoadingStateFromJson(json));
        json = this.normalizeJson(json);
        this.deserializeAttributes(json.attributes);
        this.afterDeserializeAttributes();
        this.deserializeRelations(json.relationships);
        this.fetchAllIncludedRelations();
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
        for (const relationName of Object.keys(this.$rels)) {
            clone.$rels[relationName] = this.$rels[relationName].clone();
        }
        clone.fetchAllIncludedRelations(relations);
        return clone;
    }
    get info() {
        const isClone = this._isClone ? '(CLONE)' : '';
        const loadedState = ['not', 'attributes', 'list', 'full'][this._loadingState];
        return `[${this.class.name}] id="${this.id}" ID="${this._ID}${isClone}" loaded="${loadedState}" request="${this._requestId}"`;
    }
    init() {
        // pls override
    }
    /**
     * Inspects the given JSON and calculates a richness
     * value for the given data
     */
    calculateLoadingStateFromJson(json) {
        if (!json.relationships && !json.attributes) {
            return LoadingState.NOT_LOADED;
        }
        return LoadingState.FULLY_LOADED;
    }
    normalizeJson(json) {
        return json;
    }
    afterDeserializeAttributes() {
        // hook into
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
    fetchRelation(relationName, clone, strategy = LoadingStrategy.LOAD_IF_NOT_CACHED) {
        const relation = this.$rels[relationName];
        if (relation.fetched) {
            return;
        }
        if (relation.type === Relation.HAS_ONE) {
            const currentItemState = (this[relationName] && this[relationName]._loadingState) || LoadingState.NOT_LOADED;
            // callback will be triggered if relation detects it needs new data
            relation.fetchHasOne(id => {
                return relation.Query.get(id, strategy).then((model) => {
                    if (model && clone) {
                        model = model.clone();
                    }
                    this[relationName] = model;
                    this.onRelationFetched(relation, model);
                });
            }, currentItemState, strategy);
        }
        else {
            // callback will be triggered if relation detects it needs new data
            relation.fetchHasMany(() => {
                return relation.Query.getAll().then(items => {
                    this[relationName] = [];
                    items.forEach(item => {
                        if (item && clone) {
                            item = item.clone();
                        }
                        this[relationName].push(item);
                    });
                });
            });
        }
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
    onRelationFetched(relation, data) {
        const fetchHook = 'on' + toCamelCase(relation.name);
        this[fetchHook] && this[fetchHook](data);
    }
    fetchAllIncludedRelations(relationsToClone = []) {
        for (const relationName of Object.keys(this.$rels)) {
            const relation = this.$rels[relationName];
            if (relation.hasIncludedData) {
                const clone = relationsToClone.includes(relationName);
                this.fetchRelation(relationName, clone);
            }
        }
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
Model.Query = null;
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
//# sourceMappingURL=Model.js.map