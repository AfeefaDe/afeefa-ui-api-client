const _cache = {};
export class RequestCache {
    addItem(key, promise) {
        _cache[key] = promise;
        promise.then(() => {
            delete _cache[key];
        }).catch(() => {
            delete _cache[key];
        });
    }
    hasItem(key) {
        return _cache[key] !== undefined;
    }
    getItem(key) {
        return _cache[key];
    }
    purgeItem(key) {
        delete _cache[key];
    }
}
export default new RequestCache();
//# sourceMappingURL=RequestCache.js.map