import requestCache from '../cache/RequestCache';
import resourceCache from '../cache/ResourceCache';
import ApiError from './ApiError';
import LoadingState from './LoadingState';
import LoadingStrategy from './LoadingStrategy';
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
    getList({ resource, relation, params }) {
        // key of list in resource cache
        const listType = resource.getListType();
        // different caches for different list params
        const relationListParams = relation ? relation.listParams() : {};
        const listParams = JSON.stringify(Object.assign({}, relationListParams, params));
        if (resourceCache.hasList(listType, listParams)) {
            // list already loaded
            return Promise.resolve(resourceCache.getList(listType, listParams));
        }
        if (!resource.url) {
            console.error('Keine resource.url konfiguriert', listType, listParams);
        }
        // list currently loading
        const requestKey = resource.url + (params ? JSON.stringify(params) : '');
        if (requestCache.hasItem(requestKey)) {
            return requestCache.getItem(requestKey);
        }
        // load list
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.query(params).then(response => {
            const items = [];
            const data = response.body.data || response.body; // jsonapi spec || afeefa api spec
            this.setRequestId(data);
            for (const json of data) {
                let item;
                // update existing cached items but not replace them!
                const itemType = resource.getItemType(json);
                const itemJson = resource.getItemJson(json);
                const itemId = itemJson.id;
                if (resourceCache.hasItem(itemType, itemId)) {
                    item = resourceCache.getItem(itemType, itemId);
                }
                else {
                    item = resource.createItem(json);
                    resourceCache.addItem(itemType, item);
                }
                item.deserialize(itemJson);
                // add model to list
                items.push(item);
            }
            // cache list, adds all items to the cache if not yet added
            resourceCache.addList(listType, listParams, items);
            return items;
        }).catch(response => {
            console.log('error loading list', response);
            this.onGetError(new ApiError(response));
            return [];
        });
        // cache http call
        requestCache.addItem(requestKey, promise);
        return promise;
    }
    getItem({ resource, id, strategy }) {
        if (!strategy) {
            strategy = LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED;
        }
        const itemType = resource.getItemType();
        if (!id) {
            console.debug(`API: getItem(${itemType}) - keine ID gegeben.`);
            return Promise.resolve(null);
        }
        // check if item already loaded
        if (resourceCache.hasItem(itemType, id)) {
            const item = resourceCache.getItem(itemType, id);
            if (item._loadingState === LoadingState.FULLY_LOADED && strategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED) {
                return Promise.resolve(resourceCache.getItem(itemType, id));
            }
            if (strategy === LoadingStrategy.LOAD_IF_NOT_CACHED) {
                return Promise.resolve(resourceCache.getItem(itemType, id));
            }
        }
        // item loading
        if (requestCache.hasItem(itemType + id)) {
            return requestCache.getItem(itemType + id);
        }
        // do not set id in request if it's a mocked id such as 'app'
        const requestItemId = parseInt(id, 10) ? id : undefined;
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.get({ id: requestItemId }).then(response => {
            const json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            this.setRequestId(json);
            let item;
            // update existing cached items but not replace them in order to keep references alive
            if (resourceCache.hasItem(itemType, id)) {
                item = resourceCache.getItem(itemType, id);
                item.deserialize(resource.getItemJson(json));
            }
            else {
                item = resource.createItem(json);
                resourceCache.addItem(itemType, item);
                item.deserialize(resource.getItemJson(json));
            }
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
    saveItem({ resource, item, options = {} }) {
        const itemType = resource.getItemType();
        const itemJson = item.serialize();
        const body = options.wrapInDataProperty === false ? itemJson : { data: itemJson };
        // store a deep clone of the old item
        // we do not allow saving items that are not cached beforehand
        const oldItem = resourceCache.getItem(itemType, item.id).clone();
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.update({ id: item.id }, body).then(response => {
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            // get the original item for the case the given item is a clone
            item = resourceCache.getItem(itemType, item.id);
            const json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            this.setRequestId(json);
            item.deserialize(resource.getItemJson(json));
            resource.itemSaved(oldItem, item);
            this.onSave(oldItem, item);
            return item;
        }).catch(response => {
            console.log('error saving item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    addItem({ resource, item, options = {} }) {
        const itemType = resource.getItemType();
        const itemJson = item.serialize();
        const body = options.wrapInDataProperty === false ? itemJson : { data: itemJson };
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.save({ id: item.id }, body).then(response => {
            const json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            this.setRequestId(json);
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            item = resource.createItem(json);
            resourceCache.addItem(itemType, item);
            item.deserialize(resource.getItemJson(json));
            resource.itemAdded(item);
            this.onAdd(item);
            return item;
        }).catch(response => {
            console.log('error adding item', response);
            this.onAddError(new ApiError(response));
            return null;
        });
    }
    deleteItem({ resource, item }) {
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.delete({ id: item.id }).then(() => {
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            resource.itemDeleted(item);
            this.onDelete(item);
            return true;
        }).catch(response => {
            console.log('error deleting item', response);
            this.onDeleteError(new ApiError(response));
            return null;
        });
    }
    updateItemAttributes({ resource, item, attributes }) {
        const data = {
            id: item.id,
            type: item.type,
            attributes
        };
        const resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.update({ id: item.id }, { data }).then(response => {
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            const itemType = resource.getItemType();
            const json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            this.setRequestId(json);
            const cachedItem = resourceCache.getItem(itemType, item.id);
            cachedItem.deserialize(resource.getItemJson(json));
            return attributes;
        }).catch(response => {
            console.log('error updating item attribtes', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
    }
    attachItem({ resource, item }) {
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.save({ id: item.id }, {}).then(() => {
            return true;
        }).catch(response => {
            console.log('error attaching item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    detachItem({ resource, item }) {
        const resourceProvider = this.getResourceProvider(resource);
        const promise = resourceProvider.delete({ id: item.id }).then(() => {
            return true;
        }).catch(response => {
            console.log('error detaching item', response);
            this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    }
    getResourceProvider(resource) {
        const url = resource.url;
        return this.resourceProviderFactory(url);
    }
    setRequestId(json, requestId) {
        if (!requestId) {
            requestId = ++this.requestId;
        }
        if (typeof json !== 'object' || json === null) {
            return;
        }
        Object.defineProperty(json, '_requestId', {
            value: requestId
        });
        for (const key of Object.keys(json)) {
            this.setRequestId(json[key], requestId);
        }
    }
}
export default new Api();
//# sourceMappingURL=Api.js.map