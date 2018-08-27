import API from '../api/Api'
import resourceCache from '../cache/ResourceCache'
import ReverseRelations from '../lib/ReverseRelations'
import App from '../model/App'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IQuery from './IQuery'
import IResource from './IResource'

export default class Resource implements IResource, IQuery {
  public static TYPE_RELATION: string = 'relation' //
  public static TYPE_MODEL: string = 'model' // orgas events
  public static TYPE_APP: string = 'app' // search todos

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
      if (!this.relation.Query) {
        this.relation.Query = this
      }
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
    if (json) {
      return this.getItemModel(json).type
    }
    return 'models'
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

  public updateAttributes (model: Model, attributes: object): Promise<Model | null> {
    return API.updateItemAttributes({resource: this, item: model, attributes})
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

  /**
   * Api Hooks
   */

  public itemLoaded (model: Model) {
    this.registerRelation(model)
  }

  public listLoaded (models: Model[], _params?: object) {
    models.forEach(model => {
      this.registerRelation(model)
    })
  }

  public itemAdded (model: Model) {
    // register relation with the model
    this.registerRelation(model)

    // reload relation the model is attached to
    this.relation.reloadOnNextGet()

    // invalidate new reverse relations to be established
    const relations: ReverseRelations = this.ensureReverseRelations(model)
    relations.reloadOnNextGet()
  }

  public itemDeleted (model: Model) {
    // update all relations to this model
    model.getParentRelations().forEach(relation => {
      // reload relation
      relation.reloadOnNextGet()
      // unregister relation from model
      model.unregisterParentRelation(relation)
    })

    // update relation registry of all models that
    // are linked by the deleted model
    for (const name of Object.keys(model.$rels)) {
      const relation: Relation = model.$rels[name]
      const relatedModels = relation.getRelatedModels()
      relatedModels.forEach(relatedModel => {
        relatedModel.unregisterParentRelation(relation)
      })
    }

    // invalidate obsolete reverse relations
    const relations: ReverseRelations = this.ensureReverseRelations(model)
    relations.reloadOnNextGet()
  }

  public itemSaved (modelOld: Model, model: Model) {
    // invalidate obsolete or new reverse relations to be established
    const oldRelations: ReverseRelations = this.ensureReverseRelations(modelOld)
    const newRelations: ReverseRelations = this.ensureReverseRelations(model)
    const relations = ReverseRelations.getDiff(oldRelations, newRelations)
    relations.reloadOnNextGet()
  }

  public itemAttached (model: Model) {
    this.registerRelation(model)

    // reload relation the model is attached to
    this.relation.reloadOnNextGet()

    // invalidate new reverse relations to be established
    const relations: ReverseRelations = this.ensureReverseRelations(model)
    relations.reloadOnNextGet()
  }

  public itemsAttached (models: Model[]) {
    const oldModels: Model[] = this.relation.owner[this.relation.name] || []
    oldModels.forEach(oldModel => {
      if (!models.includes(oldModel)) {
        this.itemDetached(oldModel)
      }
    })

    models.forEach(model => {
      if (!oldModels.includes(model)) {
        this.itemAttached(model)
      }
    })
  }

  public itemDetached (model: Model) {
    this.unregisterRelation(model)

    // reload relation the model is detached from
    this.relation.reloadOnNextGet()

    // invalidate obsolete reverse relations
    const relations: ReverseRelations = this.ensureReverseRelations(model)
    relations.reloadOnNextGet()
  }

  public includedRelationInitialized (models: Model[]) {
    models.forEach(model => {
      this.registerRelation(model)
    })
  }

  /**
   * Convenient Resource Cache Access
   */

  public cachePurgeList (type, key?) {
    resourceCache.purgeList(type, key)
  }

  public cachePurgeItem (type, id) {
    resourceCache.purgeItem(type, id)
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

  protected ensureReverseRelations (model: Model): ReverseRelations {
    const reverseRelations = new ReverseRelations()
    if (this.relation.reverseName) {
      reverseRelations.add(model.$rels[this.relation.reverseName])
    }
    return reverseRelations
  }

  private registerRelation (model: Model) {
    // register parent relations after item has been added to cache
    model.registerParentRelation(this.relation)
    // && console.log('register', this.relation.info, model.info, model.getParentRelations())
  }

  private unregisterRelation (model: Model) {
    // register parent relations after item has been added to cache
    model.unregisterParentRelation(this.relation)
    // && console.log('unregister', this.relation.info, model.info)
  }
}
