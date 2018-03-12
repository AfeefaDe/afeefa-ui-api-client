import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    constructor(relation) {
        super();
        this._relation = relation;
        this.Model = this._relation.Model;
    }
    getUrl() {
        // need to construct url here since owner.id is not present at construction time
        // since we are a relation resource, we can be sure that this.Model is set
        const Model = this.Model;
        return `${this.relation.owner.type}/${this.relation.owner.id}/${Model.type}{/id}`;
    }
    getListKey() {
        return this.relation.listKey();
    }
}
//# sourceMappingURL=RelationResource.js.map