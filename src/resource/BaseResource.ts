import API from '../api/Api'
import resourceCache from '../cache/ResourceCache'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IQuery from './IQuery'
import IResource from './IResource'

export default class BaseResource implements IResource, IQuery {
  protected url: string = ''
  protected Model: typeof Model | null = null

  private relationsToFetch: Relation[] = []

  /**
   * IResource
   */

  public getUrl (): string {
    return this.url
  }

  public getListType (): string {
    return this.getItemType()
  }

  public getListParams (): object {
    return {}
  }

  public getItemType (json?: any): string {
    return this.getItemModel(json).type
  }

  public getItemJson (json: any): any {
    return json
  }

  public createItem (json: any): Model {
    const item: Model = new (this.getItemModel(json))()
    item.id = json.id
    return item
  }

  public transformJsonBeforeSave (json: any) {
    // hook into
    return json
  }

  // Api Hooks


  public itemAdded (model: Model) {
    this.cachePurgeList(model.type, '{}')
  }

  public itemDeleted (model: Model) {
    this.cachePurgeItem(model.type, model.id)
    this.cachePurgeList(model.type, '{}')
  }

  public itemSaved (_modelOld: Model, _model: Model) {
    // hook into
  }

  public itemAttached(_model: Model) {
    // hook into
  }

  public itemDetached(_model: Model) {
    // hook into
  }

  /**
   * IQuery
   */

  public with (...relations): IQuery {
    const clone = this.clone()
    clone.relationsToFetch = relations
    return clone
  }

  public get (id: string, strategy?: number): Promise<Model | null> {
    if (!id) {
      return Promise.resolve(null)
    }
    return API.getItem({resource: this, id, strategy}).then(model => {
      if (model) {
        model.fetchRelationsAfterGet(this.relationsToFetch)
      }
      return model
    })
  }

  public getAll (params?: object): Promise<Model[]> {
    return API.getList({resource: this, params}).then(models => {
      models.forEach(model => {
        model.fetchRelationsAfterGet(this.relationsToFetch)
      })
      return models
    })
  }

  public save (model: Model): Promise<Model | null> {
    const action = model.id ? 'saveItem' : 'addItem'
    return API[action]({resource: this, item: model})
  }

  public delete (model): Promise<boolean | null> {
    return API.deleteItem({resource: this, item: model})
  }

  public attach (model: Model): Promise<boolean | null> {
    return API.attachItem({resource: this, item: model})
  }

  public detach (model: Model): Promise<boolean | null> {
    return API.detachItem({resource: this, item: model})
  }

  /**
   * Convenient Resource Cache Access
   */

  public cachePurgeList (key, url?) {
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

  protected init () {
    // hook into
  }

  protected getItemModel (_json: any): typeof Model {
    // hook into
    return this.Model as typeof Model
  }

  protected clone (): BaseResource {
    const Constructor = this.constructor as typeof BaseResource
    const clone = new Constructor()
    clone.url = this.url
    clone.Model = this.Model
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }
}
