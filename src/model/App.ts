import AppRelation from './AppRelation'
import ModelType from './Model'
import Relation from './Relation'

export class App {
  private _model: ModelType | null = null

  private get model () {
    if (!this._model) {
      this._model = new ModelType()
      this._model.id = '1'
      this._model.type = 'app'
    }
    return this._model
  }

  public getRelationByType (type: string): Relation {
    let relation: Relation = this.model.$rels[type]
    if (!relation) {
      relation = new AppRelation({
        owner: this.model,
        name: type,
        type: Relation.HAS_MANY
      })
      this.model.$rels[type] = relation
    }
    return relation
  }

  public getRelationByModel (Model: typeof ModelType): Relation {
    let relation: Relation = this.model.$rels[Model.type]
    if (!relation) {
      relation = new AppRelation({
        owner: this.model,
        name: Model.type,
        type: Relation.HAS_MANY,
        Model
      })
      this.model.$rels[Model.type] = relation
    }
    return relation
  }
}

export default new App()
