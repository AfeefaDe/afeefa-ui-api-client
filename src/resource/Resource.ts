import API from '../api/Api'
import resourceCache from '../cache/ResourceCache'
import { Instance as App } from '../model/App'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IQuery from './IQuery'
import IResource from './IResource'

export default class Resource implements IResource, IQuery {
  public static TYPE_RELATION: string = 'relation'
  public static TYPE_MODEL: string = 'model'
  public static TYPE_APP: string = 'app'

  public url: string = ''
  protected Model: typeof Model | null = null
  protected _relation: Relation | null = null

  private relationsToFetch: Relation[] = []

  private type: string = ''

  constructor (type?: string, relation?: Relation) {
    this.type = type || Resource.TYPE_APP

    if (relation) {
      this._relation = relation
      this.Model = relation.Model
    } else {
      const listType = this.getListType()
      if (!listType) {
        throw new Error('The resource needs to define a list type')
      }
      this._relation = App.getRelationByType(listType)
    }
  }

  /**
   * IResource
   */

  public getUrl (): string {
    if (this.type === Resource.TYPE_RELATION) {
      // need to construct url here since owner.id is not present at construction time
      // since we are a relation resource, we can be sure that this.Model is set
      const ModelClass = this.Model as typeof Model
      return `${this.relation.owner.type}/${this.relation.owner.id}/${ModelClass.type}{/id}`
    }
    return this.url
  }

  public getListType (): string {
    return this.getItemType()
  }

  public getListKey (): object {
    if (this.type === Resource.TYPE_RELATION) {
      return this.relation.listKey()
    }
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

  public clone (relation?: Relation): Resource {
    const Constructor = this.constructor as any
    const clone = new Constructor(this.type, relation || this._relation)
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
