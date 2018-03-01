import resourceCache from '../cache/ResourceCache'
import Model from '../model/Model'
import Relation from '../model/Relation'

export default class Resource {
  public listParams
  public url
  public http

  constructor (...params) {
    this.init(...params)
  }

  public init (_params?) {
    // hook into
  }

  /**
   * Resource Config
   */

  public getListType () {
    return this.getItemType()
  }

  /**
   * Since Search or Todos resources return lists of mixed items
   * we need to decide what resource cache key is to be
   * used based on the actual item's type.
   * @see Search or Todos resources
   */
  public getItemType (json?) {
    return this.getItemModel(json).type
  }

  public getItemId (json) {
    return this.getItemJson(json).id
  }

  public getItemJson (json) {
    return json
  }

  public getItemModel (_json): typeof Model {
    // hook into
    return Model
  }

  // creates a new model based on the given json response
  // @see Todos or Search
  public createItem (json) {
    const item = new (this.getItemModel(json))()
    item.id = this.getItemId(json)
    return item
  }

  // transforms the given list prior to caching
  // useful to create a hierachical list from a flat list
  // e.g. for cateories
  public transformList (_items) {
    // hook into
  }

  /**
   * Api Hooks
   */

  // called after an item has been added
  // to enable custom resource cache treatment
  public itemAdded (_item) {
    // hook into
  }

  // called after an item has been deleted
  // to enable custom resource cache treatment
  public itemDeleted (_item) {
    // hook into
  }

  public itemSaved (_itemOld, _item) {
    // hook into
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
