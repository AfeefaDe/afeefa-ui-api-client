import ModelType from './Model'
import Relation from './Relation'

export default class ModelRelation extends Relation {
  public Model: typeof ModelType

  constructor (
    {owner, name, type, Model}:
    {owner: ModelType, name: string, type: string, Model: typeof ModelType}
  ) {
    super({owner, name, type, Model})

    this.Model = Model
  }
}
