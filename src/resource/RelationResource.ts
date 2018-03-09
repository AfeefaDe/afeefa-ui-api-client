import ModelType from '../model/Model'
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
    // since we are a relation resource, we can be sure that this.Model is set
    const Model = this.Model as typeof ModelType
    return `${this.relation.owner.type}/${this.relation.owner.id}/${Model.type}{/id}`
  }

  public getListKey (): object {
    return this.relation.listKey()
  }

  public find (): ModelType | null {
    return super.find(this.relation.id)
  }
}
