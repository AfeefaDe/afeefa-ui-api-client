import requestCache from '../cache/RequestCache';
import resourceCache from '../cache/ResourceCache';
import ApiError from './ApiError';
import LoadingState from './LoadingState';
export class Api {
    constructor() {
        this.requestId = 0;
        this.resourceProviderFactory = (_url) => {
            return {};
        };
        this.onGetError = (_apiError) => null;
        this.onAdd = (_model) => null;
        this.onAddError = (_apiError) => null;
        this.onSave = (_oldModel, _model) => null;
        this.onSaveError = (_apiError) => null;
        this.onDelete = (_model) => null;
        this.onDeleteError = (_apiError) => null;
    }
    getList({ resource, params }) {
        const { listType, listKey, listParams } = this.getListMeta(resource, params);
        if (resourceCache.hasList(listType, listKey, listParams)) {
            // list already loaded
            return Promise.resolve(resourceCache.getList(listType, listKey, listParams));
        }
        if (!resource.getUrl()) {
            console.error('Keine resource.url konfiguriert', listType, listParams);
        }
        // list currently loading
        const requestKey = resource.getUrl() + (params ? JSON.stringify(params) : '');
        if (requestCache.hasItem(requestKey)) {
            return requestCache.getItem(requestKey);
        }
        // load list
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.query(params).then(response => {
            this.setRequestId();
            const data = response.body.data || response.body; // jsonapi spec || afeefa api spec
            return this.pushList({ resource, json: data, params });
        }).catch(response => {
            console.log('error loading list', response);
            this.onGetError(new ApiError(response));
            return [];
        });
        // cache http call
        requestCache.addItem(requestKey, promise);
        return promise;
    }
    getItem({ resource, id }) {
        if (!id) {
            console.debug(`API: getItem() - keine id gegeben.`);
            return Promise.resolve(null);
        }
        const itemType = resource.getItemType();
        // check if item already loaded
        if (resourceCache.hasItem(itemType, id)) {
            const item = resourceCache.getItem(itemType, id);
            if (item._loadingState === LoadingState.FULLY_LOADED) {
                return Promise.resolve(resourceCache.getItem(itemType, id));
            }
        }
        // item loading
        if (requestCache.hasItem(itemType + id)) {
            return requestCache.getItem(itemType + id);
        }
        // do not set id in request if it's a mocked id such as 'app'
        const resourceProvider = this.getResourceProvider(resource);
        const requestItemId = parseInt(id, 10) ? id : undefined;
        const promise = resourceProvider.get({ id: requestItemId }).then(response => {
            this.setRequestId();
            const json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            const item = this.pushItem({ resource, json });
            item._loadingState = LoadingState.FULLY_LOADED;
            return item;
        }).catch(response => {
            console.log('error loading item', response);
            this.onGetError(new ApiError(response));
            return null;
        });
        // cache http call
        requestCache.addItem(itemType + id, promise);
        return promise;
    }
    saveItem({ resource, item }) {
        if (!item.id) {
            console.debug(`API: saveItem() - keine item.id gegeben.`);
            return Promise.resolve(null);
        }
        // store a deep clone of the old item
        // we do not allow saving items that are not cached beforehand
        const itemType = resource.getItemType();
        const oldItem = resourceCache.getItem(itemType, item.id).clone();
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.update({ id: item.id }, item.toJson()).then(response => {
            this.setRequestId();
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            // get the original item for the case the given item is a clone
            item = resourceCache.getItem(itemType, item.id);
            let json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            json = resource.getItemJson(json);
            return item.deserialize(json, this.requestId).then(() => {
                resource.itemSaved(oldItem, item);
                this.onSave(oldItem, item);
                return item;
            });
        }).catch(response => {
            console.log('error saving item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    addItem({ resource, item }) {
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.save({ id: null }, item.toJson()).then(response => {
            this.setRequestId();
            let json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            json = resource.getItemJson(json);
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            item = resource.createItem(json);
            const itemType = resource.getItemType();
            resourceCache.addItem(itemType, item);
            return item.deserialize(json, this.requestId).then(() => {
                resource.registerRelation(item);
                resource.itemAdded(item);
                this.onAdd(item);
                return item;
            });
        }).catch(response => {
            console.log('error adding item', response);
            this.onAddError(new ApiError(response));
            return null;
        });
    }
    deleteItem({ resource, item }) {
        if (!item.id) {
            console.debug(`API: deleteItem() - keine item.id gegeben.`);
            return Promise.resolve(null);
        }
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.delete({ id: item.id }).then(() => {
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            resource.itemDeleted(item);
            this.onDelete(item);
            resource.unregisterRelation(item);
            return true;
        }).catch(response => {
            console.log('error deleting item', response);
            this.onDeleteError(new ApiError(response));
            return null;
        });
    }
    updateItemAttributes({ resource, item, attributes }) {
        if (!item.id) {
            console.debug(`API: updateItemAttributes() - keine item.id gegeben.`);
            return Promise.resolve(null);
        }
        const data = {
            id: item.id,
            type: item.type,
            attributes
        };
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.update({ id: item.id }, { data }).then(response => {
            this.setRequestId();
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            let json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            json = resource.getItemJson(json);
            const itemType = resource.getItemType();
            const cachedItem = resourceCache.getItem(itemType, item.id);
            if (cachedItem) {
                cachedItem.deserialize(json, this.requestId);
            }
            return attributes;
        }).catch(response => {
            console.log('error updating item attribtes', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
    }
    attachItem({ resource, item }) {
        if (!item.id) {
            console.debug(`API: attachItem() - keine item.id gegeben.`);
            return Promise.resolve(null);
        }
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.save({ id: item.id }, {}).then(() => {
            resource.registerRelation(item);
            resource.itemAttached(item);
            return true;
        }).catch(response => {
            console.log('error attaching item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    detachItem({ resource, item }) {
        if (!item.id) {
            console.debug(`API: detachItem() - keine item.id gegeben.`);
            return Promise.resolve(null);
        }
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.delete({ id: item.id }).then(() => {
            resource.itemDetached(item);
            resource.unregisterRelation(item);
            return true;
        }).catch(response => {
            console.log('error detaching item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    hasItem({ resource, id }) {
        if (!id) {
            return false;
        }
        const itemType = resource.getItemType();
        return resourceCache.hasItem(itemType, id);
    }
    find({ resource, id }) {
        if (!id) {
            return null;
        }
        const itemType = resource.getItemType();
        return resourceCache.getItem(itemType, id);
    }
    hasList({ resource, params }) {
        const { listType, listKey, listParams } = this.getListMeta(resource, params);
        return resourceCache.hasList(listType, listKey, listParams);
    }
    findAll({ resource, params }) {
        const { listType, listKey, listParams } = this.getListMeta(resource, params);
        return resourceCache.getList(listType, listKey, listParams);
    }
    pushList({ resource, json, params }) {
        const { listType, listKey, listParams } = this.getListMeta(resource, params);
        const items = [];
        for (const itemJson of json) {
            // update existing cached items but not replace them!
            const item = this.pushItem({ resource, json: itemJson });
            // register relation to this item
            resource.registerRelation(item);
            // add model to list
            items.push(item);
        }
        resourceCache.addList(listType, listKey, listParams, items);
        return items;
    }
    pushItem({ resource, json }) {
        json = resource.getItemJson(json);
        const itemType = resource.getItemType(json);
        const itemId = json.id;
        let item;
        // update existing cached items but not replace them in order to keep references alive
        if (resourceCache.hasItem(itemType, itemId)) {
            item = resourceCache.getItem(itemType, itemId);
        }
        else {
            item = resource.createItem(json);
            resourceCache.addItem(itemType, item);
        }
        item.deserialize(json, this.requestId);
        resource.registerRelation(item);
        return item;
    }
    purgeItem(resource, id) {
        if (id) {
            const itemType = resource.getItemType();
            // console.log('purge item', itemType, id, resource)
            resourceCache.purgeItem(itemType, id);
        }
    }
    purgeList(resource) {
        const { listType, listKey } = this.getListMeta(resource);
        // console.log('purge list', listType, listKey, resource)
        resourceCache.purgeList(listType, listKey);
    }
    getListMeta(resource, params) {
        const listType = resource.getListType();
        const listKey = JSON.stringify(resource.getListKey());
        const listParams = JSON.stringify(params || {});
        return { listType, listKey, listParams };
    }
    getResourceProvider(resource) {
        const url = resource.getUrl();
        return this.resourceProviderFactory(url);
    }
    setRequestId() {
        return ++this.requestId;
    }
}
export default new Api();
//# sourceMappingURL=Api.js.map