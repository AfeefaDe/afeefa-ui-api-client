import ResourceRegistry from '../resource/Registry'
import BaseModel from './Model'

export class ModelRegistry {
  private models = {}

  public add (name, Model) {
    this.models[name] = Model
  }

  public initializeAll () {
    for (const name of Object.keys(this.models)) {
      const Model = this.models[name]
      this.checkType(Model)
      this.initializeQuery(Model)
      this.initializeAttributes(Model)
      this.initializeRelations(Model)
    }
  }

  public getArguments (func) {
    // https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically/31194949#31194949
    return (func + '')
      .replace(/[/][/].*$/mg, '') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
      .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(',').filter(Boolean) // split & filter [""]
  }

  public get (name) {
    if (!this.models[name]) {
      console.error('error getting unknown model:', name)
    }
    return this.models[name]
  }

  public checkType (Model) {
    if (!Model.hasOwnProperty('type')) {
      console.error('Das Model', Model.name, 'hat keinen Typ')
    }
  }

  public initializeQuery (Model) {
    if (Model.hasOwnProperty('query')) {
      const args = this.getArguments(Model.query).map(arg => ResourceRegistry.get(arg))
      Model.query = Model.query(...args)
      for (const method of Model.query.getApi()) {
        if (Model[method]) {
          console.error('Das Model', Model.name, 'hat bereits eine Methode', method)
        }
        Model[method] = (...args2) => {
          return Model.query[method](...args2)
        }
      }
    }
  }

  public initializeAttributes (Model) {
    const attrs = this.setupAttributes(Model)
    // name: DataTypes.Int => name: { type: DataTypes.Int }
    for (const name of Object.keys(attrs)) {
      const attr = attrs[name]
      if (!attr.type) {
        attrs[name] = {
          type: attr
        }
      }
    }

    const attributeRemoteNameMap = {}
    for (const name of Object.keys(attrs)) {
      const attr = attrs[name]
      if (attr.remoteName) {
        attributeRemoteNameMap[attr.remoteName] = name
      }
    }
    Model._attributes = attrs
    Model._attributeRemoteNameMap = attributeRemoteNameMap
  }

  public setupAttributes (Model) {
    let attributes = {}
    if (Model !== BaseModel) {
      const superAttrs = this.setupAttributes(Object.getPrototypeOf(Model))
      attributes = superAttrs
    }
    if (Model.hasOwnProperty('attributes')) {
      attributes = {...attributes, ...Model.attributes()}
    }
    return attributes
  }

  public initializeRelations (Model) {
    const relations = this.setupRelations(Model)
    const relationRemoteNameMap = {}
    for (const name of Object.keys(relations)) {
      const relation = relations[name]
      if (relation.remoteName) {
        relationRemoteNameMap[relation.remoteName] = name
      }
    }
    Model._relations = relations
    Model._relationRemoteNameMap = relationRemoteNameMap
  }

  public setupRelations (Model) {
    let relations = {}
    if (Model !== BaseModel) {
      const superRelations = this.setupRelations(Object.getPrototypeOf(Model))
      relations = superRelations
    }
    if (Model.hasOwnProperty('relations')) {
      const args = this.getArguments(Model.relations).map(arg => this.get(arg))
      relations = {...relations, ...Model.relations(...args)}
    }
    return relations
  }
}

export default new ModelRegistry()
