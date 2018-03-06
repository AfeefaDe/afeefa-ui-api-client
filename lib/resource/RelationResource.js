import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    constructor(relation) {
        super();
        this.relation = relation;
        this.url = `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`;
        this.Model = this.relation.Model;
        this.init();
    }
}
//# sourceMappingURL=RelationResource.js.map