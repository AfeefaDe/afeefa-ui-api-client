import API from '../api/Api'

export default class Query {
  private relationsToFetch
  private owner
  private resource

  constructor () {
    this.init()
  }

  public with (...relations) {
    const clone = this.clone()
    clone.relationsToFetch = relations
    return clone
  }

  public forOwner (owner) {
    const clone = this.clone()
    clone.owner = owner
    return clone
  }

  public get (id, strategy) {
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

  public getAll (params) {
    const resource = this.getResource(params)
    return API.getList({resource, params}).then(models => {
      models.forEach(model => {
        model.fetchRelationsAfterGet()
      })
      return models
    })
  }

  public save (model, options) {
    const resource = this.getResource()
    const action = model.id ? 'saveItem' : 'addItem'
    return API[action]({resource, item: model, options})
  }

  public updateAttributes (model, attributes) {
    const resource = this.getResource()
    return API.updateItemAttributes({resource, item: model, attributes})
  }

  public delete (model) {
    const resource = this.getResource()
    return API.deleteItem({resource, item: model})
  }

  protected init () {
    // fill in
  }

  protected getApi () {
    return ['with', 'get', 'getAll', 'save', 'delete', 'updateAttributes']
  }

  protected getResource (params?) {
    if (!this.resource) {
      this.resource = this.createResource({
        owner: this.owner,
        params
      })
    }
    return this.resource
  }

  protected createResource (params) {
    console.error('Keine Resource definiert.')
  }

  private clone () {
    const Constructor = this.constructor as typeof Query
    const clone = new Constructor()
    clone.relationsToFetch = this.relationsToFetch
    return clone
  }
}
