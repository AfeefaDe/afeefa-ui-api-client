import API from '../api/Api';
export default class Query {
    constructor() {
        this.relation = null;
        this.init();
    }
    with(...relations) {
        const clone = this.clone();
        clone.relationsToFetch = relations;
        return clone;
    }
    forRelation(relation) {
        const clone = this.clone();
        clone.relation = relation;
        return clone;
    }
    get(id, strategy) {
        if (!id) {
            return Promise.resolve(null);
        }
        const resource = this.getResource();
        return API.getItem({ resource, id, strategy }).then(model => {
            if (model) {
                model.fetchRelationsAfterGet(this.relationsToFetch);
            }
            return model;
        });
    }
    getAll(params) {
        const resource = this.getResource(params);
        return API.getList({ resource, relation: this.relation, params }).then(models => {
            models.forEach(model => {
                model.fetchRelationsAfterGet();
            });
            return models;
        });
    }
    save(model, options) {
        const resource = this.getResource();
        const action = model.id ? 'saveItem' : 'addItem';
        return API[action]({ resource, item: model, options });
    }
    updateAttributes(model, attributes) {
        const resource = this.getResource();
        return API.updateItemAttributes({ resource, item: model, attributes });
    }
    delete(model) {
        const resource = this.getResource();
        return API.deleteItem({ resource, item: model });
    }
    init() {
        // fill in
    }
    getApi() {
        return ['with', 'forRelation', 'get', 'getAll', 'save', 'delete', 'updateAttributes'];
    }
    getResource(params) {
        if (!this.resource) {
            this.resource = this.createResource({
                relation: this.relation,
                params
            });
        }
        return this.resource;
    }
    createResource(_params) {
        console.error('Keine Resource definiert.');
    }
    clone() {
        const Constructor = this.constructor;
        const clone = new Constructor();
        clone.relationsToFetch = this.relationsToFetch;
        clone.relation = this.relation;
        return clone;
    }
}
//# sourceMappingURL=Query.js.map