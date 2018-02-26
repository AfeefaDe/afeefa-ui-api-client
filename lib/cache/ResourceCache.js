"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResourceCache {
    constructor() {
        this.cache = {};
    }
    purge() {
        this.cache = {};
    }
    getCache(key) {
        if (!this.cache[key]) {
            this.cache[key] = {
                lists: {},
                items: {}
            };
        }
        return this.cache[key];
    }
    addList(key, url, list) {
        const listCache = this.getCache(key).lists;
        listCache[url] = list;
        for (const item of list) {
            const cachedItem = this.getItem(item.type, item.id);
            if (cachedItem) {
                continue;
            }
            this.addItem(item.type, item);
        }
    }
    hasList(key, url) {
        return this.getCache(key).lists[url] !== undefined;
    }
    getList(key, url) {
        return this.getCache(key).lists[url];
    }
    purgeList(key, url) {
        if (url) {
            delete this.getCache(key).lists[url];
        }
        else {
            this.getCache(key).lists = {};
        }
    }
    addItem(key, item) {
        const itemCache = this.getCache(key).items;
        itemCache[item.id] = item;
    }
    hasItem(key, id) {
        return this.getCache(key).items[id] !== undefined;
    }
    getItem(key, id) {
        return this.getCache(key).items[id];
    }
    purgeItem(key, id) {
        delete this.getCache(key).items[id];
    }
}
exports.default = ResourceCache;
//# sourceMappingURL=ResourceCache.js.map