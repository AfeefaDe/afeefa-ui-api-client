import API from '../api/Api';
export default class Query {
    constructor(resource) {
        this.resource = null;
        this.relationsToFetch = [];
        if (resource) {
            this.resource = resource;
        }
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
    save(model) {
        const resource = this.getResource();
        const action = model.id ? 'saveItem' : 'addItem';
        return API[action]({ resource, item: model });
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
        return this.resource || {};
    }
    clone() {
        const Constructor = this.constructor;
        const clone = new Constructor();
        clone.resource = this.resource;
        return clone;
    }
}
//# sourceMappingURL=Query.js.map