import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class ModelResource extends BaseResource {
  constructor (relation: Relation) {
    super()

    this._relation = relation
    this.Model = relation.Model
  }
}
