import API from '../api/Api'
import Model from '../model/Model'
import Relation from '../model/Relation'
import Resource from './Resource'

export default class Query {
  private relationsToFetch: Relation[] = []

  constructor () {
    this.init()
  }

  public with (...relations): Query {
    const clone = this.clone()
    clone.relationsToFetch = relations
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

  public getAll (params?: object): Promise<Model[]> {
    const resource = this.getResource()
    return API.getList({resource, params}).then(models => {
      models.forEach(model => {
        model.fetchRelationsAfterGet(this.relationsToFetch)
      })
      return models
    })
  }

  public save (model: Model): Promise<Model | null> {
    const resource = this.getResource()
    const action = model.id ? 'saveItem' : 'addItem'
    return API[action]({resource, item: model})
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

  protected getResource (): Resource {
    return {} as Resource
  }

  private clone (): Query {
    const Constructor = this.constructor as typeof Query
    const clone = new Constructor()
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }
}
