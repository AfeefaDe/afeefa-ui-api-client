import IAttributeConfig, { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig'
import IDataType from './IDataType'
import IRelationConfig, { IRelationsConfig } from './IRelationConfig'
import ModelType from './Model'

export class ModelRegistry {
  private models: {[key: string]: typeof ModelType} = {}

  public register (Model: typeof ModelType) {
    this.models[Model.name] = Model
    return Model
  }

  public initializeAll () {
    for (const name of Object.keys(this.models)) {
      const Model = this.models[name]
      this.checkType(Model)
      this.initializeAttributes(Model)
      this.initializeRelations(Model)
    }
  }

  private checkType (Model: typeof ModelType) {
    if (!Model.hasOwnProperty('type')) {
      console.error('Das Model', Model.name, 'hat keinen Typ')
    }
  }

  private initializeAttributes (Model: typeof ModelType) {
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

  private setupAttributes (Model: typeof ModelType): IAttributesMixedConfig {
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

  private initializeRelations (Model: typeof ModelType) {
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

  private setupRelations (Model: typeof ModelType): IRelationsConfig {
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
