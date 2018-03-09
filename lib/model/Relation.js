import API from '../api/Api';
import LoadingState from '../api/LoadingState';
import LoadingStrategy from '../api/LoadingStrategy';
let ID = 0;
export default class Relation {
    constructor({ owner, name, type, Model }) {
        this.isFetching = false;
        this.fetched = false;
        this.invalidated = false;
        this.id = null;
        this.hasIncludedData = false;
        this._Query = null;
        if (!type || !Model) {
            console.error('Relation configuration invalid', ...Array.from(arguments));
        }
        this.owner = owner;
        this.name = name;
        this.type = type;
        this.Model = Model;
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
    purgeFromCacheAndMarkInvalid() {
        if (this.type === Relation.HAS_ONE) {
            API.purgeItem(this.resource, this.id);
        }
        else {
            API.purgeList(this.resource);
        }
        this.isFetching = false;
        this.fetched = false;
        this.invalidated = true;
        if (this.original) {
            this.original.purgeFromCacheAndMarkInvalid();
        }
    }
    unregisterModels() {
        if (this.type === Relation.HAS_ONE) {
            const model = this.owner[this.name];
            if (model) {
                model.unregisterParentRelation(this);
            }
        }
        else {
            const models = this.owner[this.name];
            models.forEach(model => {
                model.unregisterParentRelation(this);
            });
        }
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
            // cache list
        }
        else {
            API.pushList({ resource: this.resource, json, params: {} });
        }
        this.hasIncludedData = true;
    }
    fetchHasOne(callback, currentItemState, fetchingStrategy) {
        if (this.fetched) {
            // fetch again if we want do fully load but havent yet
            const wantToFetchMore = fetchingStrategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED &&
                currentItemState < LoadingState.FULLY_LOADED;
            if (!wantToFetchMore) {
                return;
            }
        }
        if (this.isFetching) {
            // fetch additionally if we want to fetch more detailed data
            const wantToFetchMore = fetchingStrategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED &&
                this.isFetching !== fetchingStrategy;
            if (!wantToFetchMore) {
                return;
            }
        }
        this.isFetching = fetchingStrategy;
        callback(this.id).then(() => {
            this.isFetching = false;
            this.fetched = true;
            this.invalidated = false;
        });
    }
    fetchHasMany(callback) {
        if (this.fetched) {
            return;
        }
        if (this.isFetching) {
            return;
        }
        this.isFetching = true;
        callback().then(() => {
            this.isFetching = false;
            this.fetched = true;
            this.invalidated = false;
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
    clone() {
        const clone = new Relation({
            owner: this.owner,
            name: this.name,
            type: this.type,
            Model: this.Model
        });
        clone.id = this.id;
        clone.hasIncludedData = this.hasIncludedData;
        clone.isClone = true;
        clone.original = this;
        clone.Query = this.Query;
        return clone;
    }
    get info() {
        const isClone = this.isClone ? '(CLONE)' : '';
        const itemId = this.type === Relation.HAS_ONE ? `itemId="${this.id}" ` : '';
        return `[Relation] id="${this.instanceId}${isClone}" owner="${this.owner.type}(${this.owner.id})" type="${this.type}" name="${this.name}" ` +
            `${itemId}hasIncludedData="${this.hasIncludedData}" fetched="${this.fetched}" invalidated="${this.invalidated}"`;
    }
    get resource() {
        return this._Query;
    }
    reset() {
        // id of a has_one relation, may be accompanied by json data but does not need to
        this.id = null;
        // avoid recursions, if a relation has been cached,
        // there is no need to cache its data again,
        // even if we clone the item that holds the relation
        this.hasIncludedData = false;
        this.isFetching = false;
        this.fetched = false;
        this.invalidated = false;
    }
}
Relation.HAS_ONE = 'has_one';
Relation.HAS_MANY = 'has_many';
Relation.ASSOCIATION_COMPOSITION = 'composition';
Relation.ASSOCIATION_LINK = 'link';
//# sourceMappingURL=Relation.js.map