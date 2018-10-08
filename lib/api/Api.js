import requestCache from '../cache/RequestCache';
import resourceCache from '../cache/ResourceCache';
import ApiError from './ApiError';
import LoadingState from './LoadingState';
var Api = /** @class */ (function () {
    function Api() {
        this.requestId = 0;
        this.resourceProviderFactory = function (_url) {
            return {};
        };
        this.onGetError = function (_apiError) { return null; };
        this.onAdd = function (_model) { return null; };
        this.onAddError = function (_apiError) { return null; };
        this.onSave = function (_oldModel, _model) { return null; };
        this.onSaveError = function (_apiError) { return null; };
        this.onDelete = function (_model) { return null; };
        this.onDeleteError = function (_apiError) { return null; };
    }
    Api.prototype.getList = function (_a) {
        var _this = this;
        var resource = _a.resource, params = _a.params;
        var _b = this.getListMeta(resource, params), listType = _b.listType, listKey = _b.listKey, listParams = _b.listParams;
        // check if ids are given and we already loaded models for that id
        if (params && params.ids) {
            params.ids = params.ids.filter(function (id) {
                var item = resourceCache.getItem(listType, id);
                return !item || item.loadingState < LoadingState.LIST_DATA_LOADED;
            });
            if (!params.ids.length) {
                return Promise.resolve([]);
            }
        }
        if (resourceCache.hasList(listType, listKey, listParams)) {
            // list already loaded
            return Promise.resolve(resourceCache.getList(listType, listKey, listParams));
        }
        if (!resource.getUrl()) {
            console.error('Keine resource.url konfiguriert', listType, listParams);
        }
        // list currently loading
        var requestKey = resource.getUrl() + (params ? JSON.stringify(params) : '');
        if (requestCache.hasItem(requestKey)) {
            return requestCache.getItem(requestKey);
        }
        // load list
        var resourceProvider = this.getResourceProvider(resource);
        var promise = resourceProvider.query(params).then(function (response) {
            _this.setRequestId();
            var data = response.body.data || response.body; // jsonapi spec || afeefa api spec
            var skipCachingList = params && params.ids;
            return _this.pushList({ resource: resource, json: data, params: params, skipCachingList: skipCachingList }).then(function (items) {
                items.forEach(function (item) {
                    if (resource.lazyLoadList && (!params || !params.ids)) {
                        if (item.loadingState < LoadingState.ATTRIBUTES_LOADED) {
                            item.loadingState = LoadingState.ATTRIBUTES_LOADED;
                        }
                    }
                    else {
                        if (item.loadingState < LoadingState.LIST_DATA_LOADED) {
                            item.loadingState = LoadingState.LIST_DATA_LOADED;
                        }
                    }
                });
                resource.listLoaded(items, params);
                return items;
            });
        }).catch(function (response) {
            console.log('error loading list', response);
            _this.onGetError(new ApiError(response));
            return [];
        });
        // cache http call
        requestCache.addItem(requestKey, promise);
        return promise;
    };
    Api.prototype.getItem = function (_a) {
        var _this = this;
        var resource = _a.resource, type = _a.type, id = _a.id;
        if (!id) {
            console.debug("API: getItem() - keine id gegeben.");
            return Promise.resolve(null);
        }
        var itemType = type;
        // check if item already loaded
        if (resourceCache.hasItem(itemType, id)) {
            var item = resourceCache.getItem(itemType, id);
            if (item.loadingState === LoadingState.FULLY_LOADED) {
                return Promise.resolve(resourceCache.getItem(itemType, id));
            }
        }
        // item loading
        if (requestCache.hasItem(itemType + id)) {
            return requestCache.getItem(itemType + id);
        }
        // do not set id in request if it's a mocked id such as 'app'
        var resourceProvider = this.getResourceProvider(resource);
        var requestItemId = parseInt(id, 10) ? id : undefined;
        var promise = resourceProvider.get({ id: requestItemId }).then(function (response) {
            _this.setRequestId();
            var json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            return _this.pushItem({ resource: resource, json: json }).then(function (item) {
                item.loadingState = LoadingState.FULLY_LOADED;
                resource.itemLoaded(item);
                return item;
            });
        }).catch(function (response) {
            console.log('error loading item', response);
            _this.onGetError(new ApiError(response));
            return null;
        });
        // cache http call
        requestCache.addItem(itemType + id, promise);
        return promise;
    };
    Api.prototype.saveItem = function (_a) {
        var _this = this;
        var resource = _a.resource, item = _a.item;
        if (!item.id) {
            console.debug("API: saveItem() - keine item.id gegeben.");
            return Promise.resolve(null);
        }
        // store a deep clone of the old item
        // we do not allow saving items that are not cached beforehand
        var itemType = resource.getItemType();
        var oldItem = resourceCache.getItem(itemType, item.id).clone();
        var resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.update({ id: item.id }, item.toJson()).then(function (response) {
            _this.setRequestId();
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            // get the original item for the case the given item is a clone
            item = resourceCache.getItem(itemType, item.id);
            var json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            return item.deserialize(json, _this.requestId).then(function () {
                resource.itemSaved(oldItem, item);
                _this.onSave(oldItem, item);
                return item;
            });
        }).catch(function (response) {
            console.log('error saving item', response);
            _this.onSaveError(new ApiError(response));
            return null;
        });
    };
    Api.prototype.addItem = function (_a) {
        var _this = this;
        var resource = _a.resource, item = _a.item;
        var resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.save({ id: null }, item.toJson()).then(function (response) {
            _this.setRequestId();
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            var json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            return _this.pushItem({ resource: resource, json: json }).then(function (addedItem) {
                addedItem.loadingState = LoadingState.FULLY_LOADED;
                resource.itemAdded(addedItem);
                _this.onAdd(addedItem);
                return addedItem;
            });
        }).catch(function (response) {
            console.log('error adding item', response);
            _this.onAddError(new ApiError(response));
            return null;
        });
    };
    Api.prototype.deleteItem = function (_a) {
        var _this = this;
        var resource = _a.resource, item = _a.item;
        if (!item.id) {
            console.debug("API: deleteItem() - keine item.id gegeben.");
            return Promise.resolve(null);
        }
        var resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.delete({ id: item.id }).then(function () {
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            _this.purgeItem(item.type, item.id);
            resource.itemDeleted(item);
            _this.onDelete(item);
            return true;
        }).catch(function (response) {
            console.log('error deleting item', response);
            _this.onDeleteError(new ApiError(response));
            return null;
        });
    };
    Api.prototype.updateItemAttributes = function (_a) {
        var _this = this;
        var resource = _a.resource, item = _a.item, attributes = _a.attributes;
        if (!item.id) {
            console.debug("API: updateItemAttributes() - keine item.id gegeben.");
            return Promise.resolve(null);
        }
        var resourceProvider = this.getResourceProvider(resource);
        return resourceProvider.update({ id: item.id }, item.attributesToJson(attributes)).then(function (response) {
            _this.setRequestId();
            // reset all tracked changes in order to force item.hasChanges to return false after save
            item.markSaved();
            var json = response.body.data || response.body; // jsonapi spec || afeefa api spec
            var itemType = resource.getItemType();
            var cachedItem = resourceCache.getItem(itemType, item.id);
            if (cachedItem) {
                // tslint:disable-next-line no-floating-promises
                cachedItem.deserialize(json, _this.requestId);
            }
            return attributes;
        }).catch(function (response) {
            console.log('error updating item attribtes', response);
            _this.onSaveError(new ApiError(response));
            return null;
        });
    };
    Api.prototype.attachItem = function (_a) {
        var _this = this;
        var resource = _a.resource, model = _a.model;
        if (!model.id) {
            console.debug("API: attachItem() - keine item.id gegeben.");
            return Promise.resolve(null);
        }
        var resourceProvider = this.getResourceProvider(resource);
        var data = resource.serializeAttachOrDetach(model);
        var id = typeof data === 'object' ? {} : { id: data };
        var payload = typeof data === 'object' ? data : {};
        var promise = resourceProvider.save(id, payload).then(function () {
            resource.itemAttached(model);
            return true;
        }).catch(function (response) {
            console.log('error attaching item', response);
            _this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    };
    Api.prototype.attachItems = function (_a) {
        var _this = this;
        var resource = _a.resource, models = _a.models;
        var resourceProvider = this.getResourceProvider(resource);
        var data = resource.serializeAttachOrDetachMany(models);
        var promise = resourceProvider.save({}, data).then(function () {
            resource.itemsAttached(models);
            return true;
        }).catch(function (response) {
            console.log('error attaching item', response);
            _this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    };
    Api.prototype.detachItem = function (_a) {
        var _this = this;
        var resource = _a.resource, model = _a.model;
        if (!model.id) {
            console.debug("API: detachItem() - keine item.id gegeben.");
            return Promise.resolve(null);
        }
        var resourceProvider = this.getResourceProvider(resource);
        var data = resource.serializeAttachOrDetach(model);
        var id = typeof data === 'object' ? {} : { id: data };
        var payload = typeof data === 'object' ? data : {};
        var promise = resourceProvider.delete(id, payload).then(function () {
            resource.itemDetached(model);
            return true;
        }).catch(function (response) {
            console.log('error detaching item', response);
            _this.onSaveError(new ApiError(response));
            return null;
        });
        return promise;
    };
    Api.prototype.find = function (_a) {
        var type = _a.type, id = _a.id;
        if (!type || !id) {
            return null;
        }
        return resourceCache.getItem(type, id);
    };
    Api.prototype.findAll = function (_a) {
        var resource = _a.resource, params = _a.params;
        var _b = this.getListMeta(resource, params), listType = _b.listType, listKey = _b.listKey, listParams = _b.listParams;
        return resourceCache.getList(listType, listKey, listParams);
    };
    Api.prototype.select = function (_a) {
        var resource = _a.resource, filterFunction = _a.filterFunction;
        var itemType = resource.getItemType();
        var items = resourceCache.getItems(itemType);
        return Object.keys(items).map(function (id) { return items[id]; }).filter(filterFunction);
    };
    Api.prototype.findOwners = function (_a) {
        var resource = _a.resource, filterFunction = _a.filterFunction;
        var itemType = resource.getItemType();
        var lists = resourceCache.getLists(itemType);
        var owners = [];
        Object.keys(lists).forEach(function (key) {
            var _a = JSON.parse(key), owner_type = _a.owner_type, owner_id = _a.owner_id;
            if (owner_type) {
                var paramObject_1 = lists[key];
                Object.keys(paramObject_1).forEach(function (params) {
                    var models = paramObject_1[params];
                    models.forEach(function (model) {
                        var res = filterFunction(model);
                        if (res) {
                            var owner = resourceCache.getItem(owner_type, owner_id);
                            if (owner && !owners.includes(owner)) {
                                owners.push(owner);
                            }
                        }
                    });
                });
            }
        });
        return owners;
    };
    Api.prototype.pushList = function (_a) {
        var _this = this;
        var resource = _a.resource, json = _a.json, params = _a.params, skipCachingList = _a.skipCachingList;
        var _b = this.getListMeta(resource, params), listType = _b.listType, listKey = _b.listKey, listParams = _b.listParams;
        var items = [];
        var promise = Promise.resolve();
        var _loop_1 = function (itemJson) {
            promise = promise.then(function () {
                return _this.pushItem({ resource: resource, json: itemJson }).then(function (item) {
                    items.push(item);
                });
            });
        };
        for (var _i = 0, json_1 = json; _i < json_1.length; _i++) {
            var itemJson = json_1[_i];
            _loop_1(itemJson);
        }
        return promise.then(function () {
            if (!skipCachingList) {
                resourceCache.addList(listType, listKey, listParams, items);
            }
            return items;
        });
    };
    Api.prototype.pushItem = function (_a) {
        var resource = _a.resource, json = _a.json;
        json = resource.getItemJson(json);
        var itemType = resource.getItemType(json);
        var itemId = json.id;
        var item;
        // update existing cached items but not replace them in order to keep references alive
        if (resourceCache.hasItem(itemType, itemId)) {
            item = resourceCache.getItem(itemType, itemId);
        }
        else {
            item = resource.createItem(json);
            resourceCache.addItem(itemType, item);
        }
        return item.deserialize(json, this.requestId).then(function () {
            return item;
        });
    };
    Api.prototype.purgeItem = function (type, id) {
        if (id) {
            // console.log('purge item', type, id)
            resourceCache.purgeItem(type, id);
        }
    };
    Api.prototype.purgeList = function (resource) {
        var _a = this.getListMeta(resource), listType = _a.listType, listKey = _a.listKey;
        // console.log('purge list', listType, listKey, resource)
        resourceCache.purgeList(listType, listKey);
    };
    Api.prototype.getListMeta = function (resource, params) {
        var listType = resource.getListType();
        var listKey = JSON.stringify(resource.getListKey());
        var listParams = JSON.stringify(params || resource.getDefaultListParams() || {});
        return { listType: listType, listKey: listKey, listParams: listParams };
    };
    Api.prototype.getResourceProvider = function (resource) {
        var url = resource.getUrl();
        return this.resourceProviderFactory(url);
    };
    Api.prototype.setRequestId = function () {
        return ++this.requestId;
    };
    return Api;
}());
export { Api };
export default new Api();
//# sourceMappingURL=Api.js.map