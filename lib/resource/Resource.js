import resourceCache from '../cache/ResourceCache';
import BaseResource from './BaseResource';
export default class Resource extends BaseResource {
    constructor(...params) {
        super(...params);
    }
    /**
     * Resource Cache Access
     */
    cachePurgeList(key, url) {
        resourceCache.purgeList(key, url);
    }
    cachePurgeRelation(relation) {
        relation.purgeFromCacheAndMarkInvalid();
    }
    cachePurgeItem(key, id) {
        resourceCache.purgeItem(key, id);
    }
    cacheGetAllLists(key) {
        return resourceCache.getCache(key).lists;
    }
    findCachedItem(key, id) {
        return resourceCache.getItem(key, id);
    }
}
//# sourceMappingURL=Resource.js.map