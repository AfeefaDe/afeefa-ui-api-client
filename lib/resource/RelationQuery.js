import API from '../api/Api';
import RelationResource from './RelationResource';
export default class RelationQuery {
    constructor(relation) {
        this.relation = relation;
        this.init();
    }
    setRelation(relation) {
        this.relation = relation;
    }
    getAll(params) {
        const resource = this.getResource();
        return API.getList({ resource, relation: this.relation, params }).then(models => {
            models.forEach(model => {
                model.fetchRelationsAfterGet();
            });
            return models;
        });
    }
    save(model) {
        const resource = this.getResource();
        const action = model.id ? 'saveItem' : 'addItem';
        return API[action]({ resource, item: model, options: this.getSaveOptions() }).then((contact) => {
            if (contact) {
                this.relation.purgeFromCacheAndMarkInvalid();
            }
            return contact;
        });
    }
    delete(model) {
        const resource = this.getResource();
        return API.deleteItem({ resource, item: model }).then((result) => {
            if (result) {
                this.relation.purgeFromCacheAndMarkInvalid();
            }
            return result;
        });
    }
    init() {
        // fill in
    }
    getSaveOptions() {
        return {};
    }
    getResource() {
        return new RelationResource(this.relation);
    }
}
//# sourceMappingURL=RelationQuery.js.map