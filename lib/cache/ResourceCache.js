"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResourceCache = /** @class */ (function () {
    function ResourceCache() {
        this.cache = {};
    }
    ResourceCache.prototype.purge = function () {
        this.cache = {};
    };
    ResourceCache.prototype.getCache = function (key) {
        if (!this.cache[key]) {
            this.cache[key] = {
                lists: {},
                items: {}
            };
        }
        return this.cache[key];
    };
    ResourceCache.prototype.addList = function (key, url, list) {
        var listCache = this.getCache(key).lists;
        listCache[url] = list;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var item = list_1[_i];
            var cachedItem = this.getItem(item.type, item.id);
            if (cachedItem) {
                continue;
            }
            this.addItem(item.type, item);
        }
    };
    ResourceCache.prototype.hasList = function (key, url) {
        return this.getCache(key).lists[url] !== undefined;
    };
    ResourceCache.prototype.getList = function (key, url) {
        return this.getCache(key).lists[url];
    };
    ResourceCache.prototype.purgeList = function (key, url) {
        if (url) {
            delete this.getCache(key).lists[url];
        }
        else {
            this.getCache(key).lists = {};
        }
    };
    ResourceCache.prototype.addItem = function (key, item) {
        var itemCache = this.getCache(key).items;
        itemCache[item.id] = item;
    };
    ResourceCache.prototype.hasItem = function (key, id) {
        return this.getCache(key).items[id] !== undefined;
    };
    ResourceCache.prototype.getItem = function (key, id) {
        return this.getCache(key).items[id];
    };
    ResourceCache.prototype.purgeItem = function (key, id) {
        delete this.getCache(key).items[id];
    };
    return ResourceCache;
}());
exports.ResourceCache = ResourceCache;
exports.default = new ResourceCache();
//# sourceMappingURL=ResourceCache.js.map