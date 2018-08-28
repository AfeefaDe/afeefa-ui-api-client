export class ResourceCache {
    constructor() {
        this.cache = {};
    }
    purge() {
        this.cache = {};
    }
    getCache(type) {
        if (!this.cache[type]) {
            this.cache[type] = {
                lists: {},
                items: {}
            };
        }
        return this.cache[type];
    }
    addList(type, key, params, list) {
        const listCache = this.getCache(type).lists;
        if (!listCache[key]) {
            listCache[key] = {};
        }
        listCache[key][params] = list;
        for (const item of list) {
            if (item.type) {
                const cachedItem = this.getItem(item.type, item.id);
                if (cachedItem) {
                    continue;
                }
                this.addItem(item.type, item);
            }
        }
    }
    hasList(type, key, params) {
        const cache = this.getCache(type).lists;
        if (cache[key] === undefined) {
            return false;
        }
        return cache[key][params] !== undefined;
    }
    getList(type, key, params) {
        const cache = this.getCache(type).lists;
        if (cache[key] === undefined) {
            return [];
        }
        return cache[key][params] || [];
    }
    purgeList(type, key, params) {
        const cache = this.getCache(type);
        const lists = cache.lists;
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
    }
    addItem(type, item) {
        if (!item.id) {
            console.error('ResourceCache: Cannot add Item without id:', item.info);
            return;
        }
        const itemCache = this.getCache(type).items;
        itemCache[item.id] = item;
    }
    hasItem(type, id) {
        return this.getCache(type).items[id] !== undefined;
    }
    getItem(type, id) {
        if (!id) {
            return null;
        }
        return this.getCache(type).items[id] || null;
    }
    getItems(type) {
        return this.getCache(type).items;
    }
    getLists(type) {
        return this.getCache(type).lists;
    }
    purgeItem(type, id) {
        delete this.getCache(type).items[id];
    }
}
export default new ResourceCache();
//# sourceMappingURL=ResourceCache.js.map