import API from '../api/Api'
import Model from '../model/Model'
import Relation from '../model/Relation'
import RelationResource from './RelationResource'

export default class RelationQuery {
  private relation: Relation

  constructor (relation: Relation) {
    this.relation = relation

    this.init()
  }

  public setRelation (relation: Relation) {
    this.relation = relation
  }

  public get (id: string, strategy?: number): Promise<Model | null> {
    const resource = this.getResource()
    return API.getItem({resource, id, strategy}).then(model => {
      return model
    })
  }

  public getAll (params?: object): Promise<Model[]> {
    const resource = this.getResource()
    return API.getList({resource, relation: this.relation, params}).then(models => {
      models.forEach(model => {
        model.fetchRelationsAfterGet()
      })
      return models
    })
  }

  public save (model: Model): Promise<Model | null> {
    const resource = this.getResource()
    const action = model.id ? 'saveItem' : 'addItem'
    return API[action]({resource, item: model}).then((contact: Model | null) => {
      if (contact) {
        this.relation.purgeFromCacheAndMarkInvalid()
      }
      return contact
    })
  }

  public delete (model): Promise<boolean | null> {
    const resource = this.getResource()
    return API.deleteItem({resource, item: model}).then((result: boolean | null) => {
      if (result) {
        this.relation.purgeFromCacheAndMarkInvalid()
      }
      return result
    })
  }

  public attach (model: Model): Promise<boolean | true> {
    const resource = this.getResource()
    return API.attachItem({resource, item: model}).then(result => {
      if (result) {
        this.relation.purgeFromCacheAndMarkInvalid()
      }
      return true
    })
  }

  public detach (model: Model): Promise<boolean | true> {
    const resource = this.getResource()
    return API.detachItem({resource, item: model}).then(result => {
      if (result) {
        this.relation.purgeFromCacheAndMarkInvalid()
      }
      return true
    })
  }

  protected init () {
    // fill in
  }

  protected getResource (): RelationResource {
    return new RelationResource(this.relation)
  }
}
