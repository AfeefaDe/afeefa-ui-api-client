import API from '../api/Api'
import resourceCache from '../cache/ResourceCache'
import App from '../model/App'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IQuery from './IQuery'
import IResource from './IResource'

export default class Resource implements IResource, IQuery {
  public static TYPE_RELATION: string = 'relation'
  public static TYPE_MODEL: string = 'model'
  public static TYPE_APP: string = 'app'

  public url: string = ''
  protected relation: Relation
  private relationsToFetch: Relation[] = []
  private resourceType: string = ''

  constructor (resourceType?: string, relation?: Relation) {
    this.resourceType = resourceType || Resource.TYPE_APP

    if (relation) {
      this.relation = relation
    } else {
      this.relation = App.getRelationByType(this.getListType())
    }
  }

  /**
   * IResource
   */

  public getUrl (): string {
    if (this.resourceType === Resource.TYPE_RELATION) {
      // need to construct url here since owner.id is not present at construction time
      // since we are a relation resource, we can be sure that this.Model is set
      // if you want a different url for your resource you need to override this method
      const relationType = (this.relation.Model as typeof Model).type
      return `${this.relation.owner.type}/${this.relation.owner.id}/${relationType}{/id}`
    }
    return this.url
  }

  public getListType (): string {
    if (this.relation.Model) {
      return this.relation.Model.type
    }
    throw new Error('The resource needs to implement the getListType() method')
  }

  public getListKey (): object {
    if (this.resourceType === Resource.TYPE_RELATION) {
      return this.relation.listKey()
    }
    return {}
  }

  public getItemType (json?: any): string {
    if (this.relation.Model) {
      return this.relation.Model.type
    }
    return this.getItemModel(json).type
  }

  public getItemJson (json: any): any {
    return json
  }

  public createItem (json: any): Model {
    let ModelType: typeof Model
    if (this.relation.Model) {
      ModelType = this.relation.Model
    } else {
      ModelType = this.getItemModel(json)
    }
    const item: Model = new ModelType()
    item.id = json.id
    return item
  }

  public serializeAttachOrDetach (model: Model): string | object {
    return model.id as string
  }

  public serializeAttachOrDetachMany (models: Model[]): object {
    return models.map(model => ({
      type: model.type,
      id: model.id
    }))
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
    return API.attachItem({resource: this, model})
  }

  public attachMany (models: Model[]): Promise<boolean | null> {
    return API.attachItems({resource: this, models})
  }

  public detach (model: Model): Promise<boolean | null> {
    return API.detachItem({resource: this, model})
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

  public listLoaded (_models: Model[], _params?: object) {
    // hook into
  }

  public itemAdded (model: Model) {
    // reload all relations to this model
    model.getParentRelations().forEach(relation => {
      relation.reloadOnNextGet()
    })
    // reload relation the model is attached to
    this.relation.reloadOnNextGet()
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
    // reload relation the model was attached to
    this.relation.reloadOnNextGet()
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
    const clone = new Constructor(this.resourceType, relation || this.relation)
    clone.url = this.url
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }

  protected getItemModel (_json: any): typeof Model {
    throw new Error('The resource needs to implement the getItemModel() method')
  }
}
