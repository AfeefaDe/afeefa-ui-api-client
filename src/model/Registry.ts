import IAttributeConfig, { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig'
import IDataType from './IDataType'
import IRelationConfig, { IRelationsConfig } from './IRelationConfig'
import ModelType from './Model'

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

  public initializeAttributes (Model: typeof ModelType) {
    const mixedAttrs: IAttributesMixedConfig = this.setupAttributes(Model)
    const attrs: IAttributesConfig = {}
    // convert simple DataTypes attributes to IAttributeConfig
    // name: DataTypes.Int => name: { type: DataTypes.Int }
    for (const name of Object.keys(mixedAttrs)) {
      let attr = mixedAttrs[name]
      if (!(attr as any).type) {
        attr = { type: attr as IDataType<any> }
      }
      attrs[name] = attr as IAttributeConfig
    }

    const attributeRemoteNameMap = {}
    for (const name of Object.keys(attrs)) {
      const attr: IAttributeConfig = attrs[name]
      if (attr.remoteName) {
        attributeRemoteNameMap[attr.remoteName] = name
      }
    }
    Model._attributes = attrs
    Model._attributeRemoteNameMap = attributeRemoteNameMap
  }

  public setupAttributes (Model: typeof ModelType): IAttributesMixedConfig {
    let attributes: IAttributesMixedConfig = {}
    if (Model !== ModelType) {
      const superAttrs = this.setupAttributes(Object.getPrototypeOf(Model))
      attributes = superAttrs
    }
    if (Model.hasOwnProperty('attributes')) {
      attributes = {...attributes, ...Model.attributes()}
    }
    return attributes
  }

  public initializeRelations (Model: typeof ModelType) {
    const relations: IRelationsConfig = this.setupRelations(Model)
    const relationRemoteNameMap = {}
    for (const name of Object.keys(relations)) {
      const relation: IRelationConfig = relations[name]
      if (relation.remoteName) {
        relationRemoteNameMap[relation.remoteName] = name
      }
    }
    Model._relations = relations
    Model._relationRemoteNameMap = relationRemoteNameMap
  }

  public setupRelations (Model: typeof ModelType): IRelationsConfig {
    let relations: IRelationsConfig = {}
    if (Model !== ModelType) {
      const superRelations = this.setupRelations(Object.getPrototypeOf(Model))
      relations = superRelations
    }
    relations = {...relations, ...Model.relations()}
    return relations
  }
}

export default new ModelRegistry()
