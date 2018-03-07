import Model from '../model/Model'
import Relation from '../model/Relation'
import BaseResource from './BaseResource'

export default class RelationResource extends BaseResource {
  private relation: Relation

  constructor (relation: Relation) {
    super()

    this.relation = relation

    this.Model = this.relation.Model

    this.init()
  }

  public getUrl (): string {
    return `${this.relation.owner.type}/${this.relation.owner.id}/${this.relation.Model.type}{/id}`
  }

  /**
   * IResource
   */

  public getListParams (): object {
    return this.relation.listParams()
  }

  // Api Hooks

  public itemAdded (_model: Model) {
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemDeleted (_model: Model) {
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemSaved (_modelOld: Model, _model: Model) {
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemAttached(_model: Model) {
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  public itemDetached(_model: Model) {
    this.relation.purgeFromCacheAndMarkInvalid()
  }

  protected clone (): BaseResource {
    const clone = super.clone() as RelationResource
    clone.relation = this.relation
    return clone
  }
}
