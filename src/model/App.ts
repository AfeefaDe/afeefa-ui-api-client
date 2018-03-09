import AppRelation from './AppRelation'
import ModelType from './Model'
import Relation from './Relation'

export default class App extends ModelType {
  private static _instance: App

  public static get instance () {
    if (!App._instance) {
      App._instance = new App()
    }
    return App._instance
  }

  constructor () {
    super()

    this.id = '1'
    this.type = 'app'
  }

  public getRelationByType (type: string): Relation {
    let relation: Relation = this.$rels[type]
    if (!relation) {
      relation = new AppRelation({
        owner: this,
        name: type,
        type: Relation.HAS_MANY
      })
      this.$rels[type] = relation
    }
    return relation
  }

  public getRelationByModel (Model: typeof ModelType): Relation {
    let relation: Relation = this.$rels[Model.type]
    if (!relation) {
      relation = new AppRelation({
        owner: this,
        name: Model.type,
        type: Relation.HAS_MANY,
        Model
      })
      this.$rels[Model.type] = relation
    }
    return relation
  }
}

export const Instance = App.instance
