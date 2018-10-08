var ResourceCache = /** @class */ (function () {
    function ResourceCache() {
        this.cache = {};
    }
    ResourceCache.prototype.purge = function () {
        this.cache = {};
    };
    ResourceCache.prototype.getCache = function (type) {
        if (!this.cache[type]) {
            this.cache[type] = {
                lists: {},
                items: {}
            };
        }
        return this.cache[type];
    };
    ResourceCache.prototype.addList = function (type, key, params, list) {
        var listCache = this.getCache(type).lists;
        if (!listCache[key]) {
            listCache[key] = {};
        }
        listCache[key][params] = list;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var item = list_1[_i];
            if (item.type) {
                var cachedItem = this.getItem(item.type, item.id);
                if (cachedItem) {
                    continue;
                }
                this.addItem(item.type, item);
            }
        }
    };
    ResourceCache.prototype.hasList = function (type, key, params) {
        var cache = this.getCache(type).lists;
        if (cache[key] === undefined) {
            return false;
        }
        return cache[key][params] !== undefined;
    };
    ResourceCache.prototype.getList = function (type, key, params) {
        var cache = this.getCache(type).lists;
        if (cache[key] === undefined) {
            return [];
        }
        return cache[key][params] || [];
    };
    ResourceCache.prototype.purgeList = function (type, key, params) {
        var cache = this.getCache(type);
        var lists = cache.lists;
        if (params && key) {
            if (lists[key]) {
                delete lists[key][params];
            }
        }
        else if (key) {
            delete lists[key];
        }
        else {
            cache.lists = {};
        }
    };
    ResourceCache.prototype.addItem = function (type, item) {
        if (!item.id) {
            console.error('ResourceCache: Cannot add Item without id:', item.info);
            return;
        }
        var itemCache = this.getCache(type).items;
        itemCache[item.id] = item;
    };
    ResourceCache.prototype.hasItem = function (type, id) {
        return this.getCache(type).items[id] !== undefined;
    };
    ResourceCache.prototype.getItem = function (type, id) {
        if (!id) {
            return null;
        }
        return this.getCache(type).items[id] || null;
    };
    ResourceCache.prototype.getItems = function (type) {
        return this.getCache(type).items;
    };
    ResourceCache.prototype.getLists = function (type) {
        return this.getCache(type).lists;
    };
    ResourceCache.prototype.purgeItem = function (type, id) {
        delete this.getCache(type).items[id];
    };
    return ResourceCache;
}());
export { ResourceCache };
export default new ResourceCache();
//# sourceMappingURL=ResourceCache.js.map