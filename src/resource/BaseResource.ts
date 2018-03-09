import API from '../api/Api'
import resourceCache from '../cache/ResourceCache'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IQuery from './IQuery'
import IResource from './IResource'

export default class BaseResource implements IResource, IQuery {
  public url: string = ''
  protected Model: typeof Model | null = null
  protected _relation: Relation | null = null

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

  public getListKey (): object {
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

  /**
   * IQuery
   */

  public with (...relations): IQuery {
    const clone = this.clone()
    clone.relationsToFetch = relations
    return clone
  }

  public get (id?: string | null, strategy?: number): Promise<Model | null> {
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

  public find (id?: string | null): Model | null {
    return API.find({resource: this, id})
  }

  public findAll (params?: object): Model[] {
    return API.findAll({resource: this, params})
  }

  // Api Hooks

  public itemsLoaded (models: Model[]) {
    // register parent relations after items have been added to cache
    models.map(model => {
      model.registerParentRelation(this.relation)
    })
  }

  public itemLoaded (model: Model) {
    // register parent relations after item has been added to cache
    model.registerParentRelation(this.relation)
  }

  public itemAdded (model: Model) {
    // register parent relations after item has been added to cache
    model.registerParentRelation(this.relation)
    // purge parent relation after item has been added to remote
    // POST /events -> invalidate App.events
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemDeleted (model: Model) {
    // remove the deleted item from item cache
    // DELETE /events/123 -> purge events.123
    API.purgeItem(this, model.id)
    // remove the deleted item from all including lists
    // DELETE /events/123 -> invalidate App.events, Orga.123/events
    model.getParentRelations().forEach(relation => {
      relation.purgeFromCacheAndMarkInvalid()
    })
    // unregister all relations of this model
    for (const name of Object.keys(model.$rels)) {
      const relation: Relation = model.$rels[name]
      relation.unregisterModels()
    }
  }

  public itemSaved (_modelOld: Model, _model: Model) {
    // hook into
    // there is no generic handling of saved items
  }

  public itemAttached (model: Model) {
    // register this relation with the just attached model
    model.registerParentRelation(this.relation)
    // purge list that have been attached to
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemDetached (model: Model) {
    // unregister this relation with the just detached model
    model.unregisterParentRelation(this.relation)
    // purge list that have been detached from
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  /**
   * Convenient Resource Cache Access
   */

  public findCachedItemsBy (type: string, params: object): Model[] {
    const items = resourceCache.getCache(type).items
    const result: Model[] = []
    for (const id of Object.keys(items)) {
      const model: Model = items[id]
      for (const key of Object.keys(params)) {
        if (model[key] !== params[key]) {
          break
        }
        result.push(model)
      }
    }
    return result
  }

  public cachePurgeList (type, key?) {
    resourceCache.purgeList(type, key)
  }

  public cacheGetAllLists (type) {
    return resourceCache.getCache(type).lists
  }

  public findCachedItem (type, id) {
    return resourceCache.getItem(type, id)
  }

  protected get relation (): Relation {
    return this._relation as Relation
  }

  protected getItemModel (_json: any): typeof Model {
    // hook into
    return this.Model as typeof Model
  }

  protected clone (): BaseResource {
    const Constructor = this.constructor as any
    const clone = new Constructor(this._relation)
    clone.url = this.url
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }
}
