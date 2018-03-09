import ModelType from '../model/Model'
import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class ModelResource extends BaseResource {
  constructor (relation: Relation) {
    super()

    this._relation = relation
    this.Model = relation.Model
  }

  public itemLoaded (_model: ModelType) {
    // not supported
    // app level items can be found via API.getItem(type, id)
  }
}
