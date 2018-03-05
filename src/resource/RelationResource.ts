import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class RelationResource extends BaseResource {
  private relation: Relation

  constructor (relation: Relation) {
    super()

    this.relation = relation

    this.url = this.url || `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`
    this.Model = this.relation.Model
  }
}
