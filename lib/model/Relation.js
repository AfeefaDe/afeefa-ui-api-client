import API from '../api/Api';
let ID = 0;
export default class Relation {
    constructor({ owner, name, type, Model }) {
        this.Model = null;
        this.fetched = false;
        this.invalidated = false;
        this.id = null;
        this._Query = null;
        if (!type) {
            console.error('Relation configuration invalid', ...Array.from(arguments));
        }
        this.owner = owner;
        this.name = name;
        this.type = type;
        this.Model = Model || null;
        this.instanceId = ++ID;
        this.isClone = false;
        this.original = null;
        this.reset();
    }
    set Query(query) {
        this._Query = query;
    }
    get Query() {
        return this._Query;
    }
    reloadOnNextGet() {
        if (this.original) {
            this.original.reloadOnNextGet();
            return;
        }
        if (this.type === Relation.HAS_ONE) {
            API.purgeItem(this.resource, this.id);
        }
        else {
            API.purgeList(this.resource);
        }
        this.fetched = false;
        this.invalidated = true;
    }
    getRelatedModels() {
        if (this.type === Relation.HAS_ONE) {
            const model = this.owner[this.name];
            if (model) {
                return [model];
            }
        }
        else {
            return this.owner[this.name];
        }
        return [];
    }
    listKey() {
        return {
            owner_type: this.owner.type,
            owner_id: this.owner.id,
            relation: this.name
        };
    }
    deserialize(json) {
        this.reset();
        // { data: null } is valid
        json = json.hasOwnProperty('data') ? json.data : json; // jsonapi-spec fallback
        // cache item
        if (this.type === Relation.HAS_ONE) {
            // if no json given -> related object === null
            if (json) {
                const item = API.pushItem({ resource: this.resource, json });
                // store the id
                this.id = item.id;
            }
            else {
                // reset id to null
                this.id = null;
            }
            // cache list
        }
        else {
            API.pushList({ resource: this.resource, json, params: {} });
        }
    }
    fetch(clone, forceLoading) {
        if (this.fetched) {
            return Promise.resolve(true);
        }
        let promise;
        if (this.type === Relation.HAS_ONE) {
            promise = (forceLoading ? this.getHasOne() : this.findHasOne()).then((model) => {
                if (model && clone) {
                    model = model.clone();
                }
                return model;
            });
        }
        else {
            promise = (forceLoading ? this.getHasMany() : this.findHasMany()).then((items) => {
                const models = [];
                items.forEach(item => {
                    if (item && clone) {
                        item = item.clone();
                    }
                    models.push(item);
                });
                return models;
            });
        }
        return promise.then(result => {
            this.fetched = true;
            this.invalidated = false;
            this.owner.onRelationFetched(this, result);
        });
    }
    /**
     * A cloned item will also have all relations cloned from it's orginal.
     * The clone item must fetch any relation on its own and hence runs its
     * own process of collecting data - fully independent from the original.
     *
     * In order to fetch the necessary resources of the original, we need to
     * copy initial data json/id as well as (for performance reasons) the
     * hint, if the relation data has already been synced to the resource cache.
     */
    clone(owner) {
        const clone = new Relation({
            owner,
            name: this.name,
            type: this.type,
            Model: this.Model || undefined
        });
        clone.id = this.id;
        clone.isClone = true;
        clone.original = this;
        // clone resource with our cloned relation
        clone.Query = this.Query.clone(clone);
        return clone;
    }
    get info() {
        const isClone = this.isClone ? '(CLONE)' : '';
        const itemId = this.type === Relation.HAS_ONE ? `itemId="${this.id}" ` : '';
        return `[Relation] id="${this.instanceId}${isClone}" owner="${this.owner.type}(${this.owner.id})" type="${this.type}" name="${this.name}" ` +
            `${itemId}fetched="${this.fetched}" invalidated="${this.invalidated}"`;
    }
    get resource() {
        return this._Query;
    }
    findHasOne() {
        return Promise.resolve(this.Query.find());
    }
    getHasOne() {
        return this.Query.get(this.id);
    }
    findHasMany() {
        return Promise.resolve(this.Query.findAll());
    }
    getHasMany() {
        return this.Query.getAll();
    }
    reset() {
        // id of a has_one relation, may be accompanied by json data but does not need to
        this.id = null;
        this.fetched = false;
        this.invalidated = false;
    }
}
Relation.HAS_ONE = 'has_one';
Relation.HAS_MANY = 'has_many';
Relation.ASSOCIATION_COMPOSITION = 'composition';
Relation.ASSOCIATION_LINK = 'link';
//# sourceMappingURL=Relation.js.map