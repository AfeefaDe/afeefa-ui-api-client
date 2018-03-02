import API from '../api/Api'
import Model from '../model/Model'
import Relation from '../model/Relation'

export default class Query {
  private relationsToFetch: Relation[] = []
  private relation: Relation | null = null
  private resource

  constructor () {
    this.init()
  }

  public with (...relations): Query {
    const clone = this.clone()
    clone.relationsToFetch = relations
    return clone
  }

  public forRelation (relation: Relation): Query {
    if (!relation) {
      console.error('No relation given for Query.forRelation')
    }
    const clone = this.clone()
    clone.relation = relation
    return clone
  }

  public get (id, strategy): Promise<Model | null> {
    if (!id) {
      return Promise.resolve(null)
    }
    const resource = this.getResource()
    return API.getItem({resource, id, strategy}).then(model => {
      if (model) {
        model.fetchRelationsAfterGet(this.relationsToFetch)
      }
      return model
    })
  }

  public getAll (params): Promise<Model[]> {
    const resource = this.getResource(params)
    return API.getList({resource, relation: this.relation, params}).then(models => {
      models.forEach(model => {
        model.fetchRelationsAfterGet()
      })
      return models
    })
  }

  public save (model: Model, options: object): Promise<Model | null> {
    const resource = this.getResource()
    const action = model.id ? 'saveItem' : 'addItem'
    return API[action]({resource, item: model, options})
  }

  public updateAttributes (model: Model, attributes: object): Promise<any> {
    const resource = this.getResource()
    return API.updateItemAttributes({resource, item: model, attributes})
  }

  public delete (model): Promise<boolean | null> {
    const resource = this.getResource()
    return API.deleteItem({resource, item: model})
  }

  protected init () {
    // fill in
  }

  protected getApi () {
    return ['with', 'forRelation', 'get', 'getAll', 'save', 'delete', 'updateAttributes']
  }

  protected getResource (params?) {
    if (!this.resource) {
      this.resource = this.createResource({
        relation: this.relation,
        params
      })
    }
    return this.resource
  }

  protected createResource (_params) {
    console.error('Keine Resource definiert.')
  }

  private clone () {
    const Constructor = this.constructor as typeof Query
    const clone = new Constructor()
    clone.relationsToFetch = this.relationsToFetch
    clone.relation = this.relation
    return clone
  }
}
