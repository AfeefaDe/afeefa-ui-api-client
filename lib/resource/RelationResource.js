import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    constructor(relation) {
        super();
        this.relation = relation;
        this.Model = this.relation.Model;
        this.init();
    }
    getUrl() {
        return `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`;
    }
    /**
     * IResource
     */
    getListParams() {
        return this.relation.listParams();
    }
    // Api Hooks
    itemAdded(_model) {
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemDeleted(_model) {
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemSaved(_modelOld, _model) {
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemAttached(_model) {
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    itemDetached(_model) {
        this.relation.purgeFromCacheAndMarkInvalid();
    }
    clone() {
        const clone = super.clone();
        clone.relation = this.relation;
        return clone;
    }
}
//# sourceMappingURL=RelationResource.js.map