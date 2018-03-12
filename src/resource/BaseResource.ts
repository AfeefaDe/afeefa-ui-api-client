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

  public get (id?: string | null): Promise<Model | null> {
    if (!id) {
      return Promise.resolve(null)
    }
    return API.getItem({resource: this, id}).then(model => {
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
    if (!id && this.relation.type === Relation.HAS_ONE) {
      id = this.relation.id
    }
    return API.find({resource: this, id})
  }

  public findAll (params?: object): Model[] {
    return API.findAll({resource: this, params})
  }

  // Api Hooks

  public registerRelation (model: Model) {
    // register parent relations after item has been added to cache
    model.registerParentRelation(this.relation)
  }

  public unregisterRelation (model: Model) {
    // register parent relations after item has been added to cache
    model.unregisterParentRelation(this.relation)
  }

  public itemAdded (model: Model) {
    // reload all relations to this model
    model.getParentRelations().forEach(relation => {
      relation.reloadOnNextGet()
    })
  }

  public itemDeleted (model: Model) {
    // remove model from item cache
    API.purgeItem(this, model.id)
    // reload all relations to this model
    model.getParentRelations().forEach(relation => {
      relation.reloadOnNextGet()
    })
    // unregister all relations that link to this model
    for (const name of Object.keys(model.$rels)) {
      const relation: Relation = model.$rels[name]
      const relatedModels = relation.getRelatedModels()
      relatedModels.forEach(related => {
        related.unregisterParentRelation(relation)
      })
    }
  }

  public itemSaved (_modelOld: Model, _model: Model) {
    // handle reload relations specific to model
  }

  public itemAttached (_model: Model) {
    // reload relation the model is attached to
    this.relation.reloadOnNextGet()
  }

  public itemDetached (_model: Model) {
    // reload relation the model is detached from
    this.relation.reloadOnNextGet()
  }

  /**
   * Convenient Resource Cache Access
   */

  public cachePurgeList (type, key?) {
    resourceCache.purgeList(type, key)
  }

  public clone (relation?: Relation): BaseResource {
    const Constructor = this.constructor as any
    const clone = new Constructor(relation || this._relation)
    clone.url = this.url
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }

  protected get relation (): Relation {
    return this._relation as Relation
  }

  protected getItemModel (_json: any): typeof Model {
    // hook into
    return this.Model as typeof Model
  }
}
