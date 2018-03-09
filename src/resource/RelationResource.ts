import Model from '../model/Model'
import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class RelationResource extends BaseResource {
  constructor (relation: Relation) {
    super()

    this._relation = relation
    this.Model = this._relation.Model
  }

  public getUrl (): string {
    // need to construct url here since owner.id is not present at construction time
    return `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`
  }

  public getListKey (): object {
    return this.relation.listKey()
  }

  public find (): Model | null {
    return super.find(this.relation.id)
  }
}
