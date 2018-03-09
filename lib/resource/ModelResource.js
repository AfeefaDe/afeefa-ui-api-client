import BaseResource from './BaseResource';
export default class ModelResource extends BaseResource {
    constructor(relation) {
        super();
        this._relation = relation;
        this.Model = relation.Model;
    }
    itemLoaded(_model) {
        // not supported
        // app level items can be found via API.getItem(type, id)
    }
}
//# sourceMappingURL=ModelResource.js.map