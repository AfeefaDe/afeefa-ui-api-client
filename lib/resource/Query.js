import API from '../api/Api';
export default class Query {
    constructor() {
        this.relationsToFetch = [];
        this.init();
    }
    with(...relations) {
        const clone = this.clone();
        clone.relationsToFetch = relations;
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
        const resource = this.getResource();
        return API.getList({ resource, params }).then(models => {
            models.forEach(model => {
                model.fetchRelationsAfterGet(this.relationsToFetch);
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
    getResource() {
        return {};
    }
    clone() {
        const Constructor = this.constructor;
        const clone = new Constructor();
        clone.relationsToFetch = this.relationsToFetch;
        return clone;
    }
}
//# sourceMappingURL=Query.js.map