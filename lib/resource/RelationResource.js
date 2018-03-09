import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    constructor(relation) {
        super();
        this._relation = relation;
        this.Model = this._relation.Model;
    }
    getUrl() {
        // need to construct url here since owner.id is not present at construction time
        return `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`;
    }
    getListKey() {
        return this.relation.listKey();
    }
    find() {
        return super.find(this.relation.id);
    }
}
//# sourceMappingURL=RelationResource.js.map