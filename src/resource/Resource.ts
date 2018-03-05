import resourceCache from '../cache/ResourceCache'
import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class Resource extends BaseResource {
  constructor (...params) {
    super(...params)
  }

  /**
   * Resource Cache Access
   */

  public cachePurgeList (key, url) {
    resourceCache.purgeList(key, url)
  }

  public cachePurgeRelation (relation: Relation) {
    relation.purgeFromCacheAndMarkInvalid()
  }

  public cachePurgeItem (key, id) {
    resourceCache.purgeItem(key, id)
  }

  public cacheGetAllLists (key) {
    return resourceCache.getCache(key).lists
  }

  public findCachedItem (key, id) {
    return resourceCache.getItem(key, id)
  }
}
