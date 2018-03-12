import BaseResource from './BaseResource';
export default class ModelResource extends BaseResource {
    constructor(relation) {
        super();
        this._relation = relation;
        this.Model = relation.Model;
    }
}
//# sourceMappingURL=ModelResource.js.map