import LoadingState from '../api/LoadingState'
import { enumerable } from '../decorator/enumerable'
import toCamelCase from '../filter/camel-case'
import IQuery from '../resource/IQuery'
import Resource from '../resource/Resource'
import DataTypes from './DataTypes'
import IAttributeConfig, { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig'
import IRelationConfig, { IRelationsConfig } from './IRelationConfig'
import Relation from './Relation'

let ID = 0

export default class Model {
  public static type: string = 'models'
  public static Query: IQuery
  public static Resource: typeof Resource | null = null
  public static ResourceUrl: string | null = null

  public static _relations: IRelationsConfig = {}
  public static _attributes: IAttributesConfig = {}
  public static _attributeRemoteNameMap: object = {}
  public static _relationRemoteNameMap: object = {}

  public id: string | null = null
  public type: string | null = null

  @enumerable(false)
  public $rels: {[key: string]: Relation} = {}

  @enumerable(false)
  public _loadingState: number = LoadingState.NOT_FULLY_LOADED

  @enumerable(false)
  private _ID: number = ++ID

  @enumerable(false)
  private _requestId: number = 0

  @enumerable(false)
  private _isClone: boolean = false

  @enumerable(false)
  private _original: Model | null = null

  @enumerable(false)
  private _lastSnapshot: string = ''

  @enumerable(false)
  private _parentRelations: Set<Relation> = new Set()

  @enumerable(false)
  private _numDeserializedAttributes: number = 0

  constructor () {
    // init attributes
    for (const name of Object.keys(this.class._attributes)) {
      const attr: IAttributeConfig = this.class._attributes[name]
      this[name] = attr.hasOwnProperty('default') ? attr.default : attr.type.value()
    }
    this.type = this.class.type

    // init relations
    for (const relationName of Object.keys(this.class._relations)) {
      const relationConfig: IRelationConfig = this.class._relations[relationName]

      this[relationName] = relationConfig.type === Relation.HAS_MANY ? [] : null

      const {remoteName, Resource: ResourceType, ...relationParams} = relationConfig // splice remoteName and Resource
      const relation: Relation = new Relation({owner: this, name: relationName, ...relationParams})

      if (!relation.Model) {
        throw new Error('You need to specify a Model for a Relation')
      }

      // create resource from config (resource or relation resourse)
      if (ResourceType) {
        relation.Query = new ResourceType(Resource.TYPE_RELATION, relation)
      // create a default resource
      } else {
        // reuse existing model resource for has one relations
        if (relation.type === Relation.HAS_ONE) {
          if (!relation.Model.Query) {
            throw new Error('Using a Model in a Relation requires a Resource to be defined for that Model')
          }
          // clone model resource with our relation
          relation.Query = relation.Model.Query.clone(relation)
        // create a default relation resource
        } else {
          relation.Query = new Resource(Resource.TYPE_RELATION, relation)
        }
      }

      this.$rels[relationName] = relation
    }

    this.init()
  }

  public static relations (): IRelationsConfig {
    return {}
  }

  public static attributes (): IAttributesMixedConfig {
    return {
      id: DataTypes.String,

      type: DataTypes.String
    }
  }

  /**
   * Relations
   */

  public fetchRelationsAfterGet (relationsToFullyFetch: any[] = []) {
    for (const relationName of Object.keys(this.$rels)) {
      const relation: Relation = this.$rels[relationName]
      if (relationsToFullyFetch.includes(relationName)) {
        relation.fetched = false
        relation.fetch(false, true)
      } else if (relation.invalidated) {
        relation.fetch(false, true)
      }
    }
  }

  public registerParentRelation (relation: Relation) {
    // console.log('register parent', this._ID, this.type, this.id, relation.info)
    this._parentRelations.add(relation)
  }

  public getParentRelations (): Set<Relation> {
    return this._parentRelations
  }

  public unregisterParentRelation (relation: Relation) {
    // console.log('unregister parent', this._ID, this.type, this.id, relation.info)
    this._parentRelations.delete(relation)
  }

  /**
   * Serialization
   */

  public deserialize (json: any, requestId: number): Promise<any> {
    const numDeserializedAttributes = this.countJsonKeys(json)
    const isSameRequest = requestId === this._requestId
    if (isSameRequest && numDeserializedAttributes <= this._numDeserializedAttributes) {
      return Promise.resolve(true)
    }

    this._requestId = requestId
    this._numDeserializedAttributes = numDeserializedAttributes

    this.id = json.id

    json = this.beforeDeserialize(json)

    this.deserializeAttributes(json.attributes || json)
    this.afterDeserializeAttributes()

    this.deserializeRelations(json.relationships || json)

    return this.fetchAllIncludedRelations()
  }

  public toJson (): object {
    return this.serialize()
  }

  public serialize (): object {
    // default serialization
    const data = {
      id: this.id,
      type: this.type
    }
    return data
  }

  public hasChanges (): boolean {
    if (this._original) {
      if (!this._lastSnapshot) {
        this._lastSnapshot = JSON.stringify(this._original.serialize())
      }
      const json = JSON.stringify(this.serialize())
      return this._lastSnapshot !== json
    }
    return false
  }

  public markSaved () {
    this._lastSnapshot = JSON.stringify(this.serialize())
  }

  public clone (): Model {
    return this.cloneWith()
  }

  public cloneWith (...relations): Model {
    const clone: Model = this._clone(this) as Model
    clone._isClone = true
    clone._original = this
    clone._requestId = this._requestId
    clone._loadingState = this._loadingState

    clone._parentRelations = this._parentRelations

    for (const relationName of Object.keys(this.$rels)) {
      clone.$rels[relationName] = this.$rels[relationName].clone(clone)
    }
    clone.fetchAllIncludedRelations(relations)

    return clone
  }

  public get info (): string {
    const isClone = this._isClone ? '(CLONE)' : ''
    return `[${this.class.name}] id="${this.id}" ID="${this._ID}${isClone}" request="${this._requestId}"`
  }

  public onRelationFetched (relation: Relation, data: Model | Model[] | null) {
    this[relation.name] = data

    const fetchHook = 'on' + toCamelCase(relation.name)
    this[fetchHook] && this[fetchHook](data)
  }

  protected init () {
    // pls override
  }

  protected beforeDeserialize (json) {
    return json
  }

  protected afterDeserializeAttributes () {
    // hook into
  }

  private countJsonKeys (json: object, level: number = 0): number {
    let numKeys = 0
    if (level < 3 && json && typeof json === 'object') {
      for (const key of Object.keys(json)) {
        numKeys = numKeys + 1 + this.countJsonKeys(json[key], level + 1)
      }
    }
    return numKeys
  }

  /**
   * magic clone function :-)
   * clone anything but no model relations
   */
  private _clone (value) {
    if (value instanceof Model) {
      const model = value
      const Constructor = model.class
      const clone = new Constructor()
      for (const key of Object.keys(model)) {
        const keyVal = model[key]
        // set model associations to null, let the clone fetch the relation
        if (keyVal instanceof Model) {
          clone[key] = null
          continue
        }
        clone[key] = this._clone(keyVal)
      }
      return clone
    }

    if (Array.isArray(value)) {
      const array = value
      const clone: any[] = []
      for (const arrVal of array) {
        if (arrVal instanceof Model) {
          // do not clone associations
          continue
        }
        clone.push(this._clone(arrVal))
      }
      return clone
    }

    if (value instanceof Date) {
      return new Date(value.getTime())
    }

    if (value !== null && typeof value === 'object') {
      const obj = value
      const clone = {}
      for (const key of Object.keys(obj)) {
        const keyVal = obj[key]
        // set model associations to null, let the clone fetch the relation
        if (keyVal instanceof Model) {
          clone[key] = null
          continue
        }
        clone[key] = this._clone(keyVal)
      }
      return clone
    }

    return value
  }

  private get class (): typeof Model {
    return this.constructor as typeof Model
  }

  private hasAttr (name: string): boolean {
    return !!this.class._attributes[name]
  }

  private getAttrValue (name: string, value: any): any {
    const attr: IAttributeConfig = this.class._attributes[name]
    // return custom value calclulation or the default calculation of the type
    return attr.value ? attr.value(value) : attr.type.value(value)
  }

  private hasRelation (name: string): boolean {
    return !!this.class._relations[name]
  }

  private fetchAllIncludedRelations (relationsToClone: string[] = []): Promise<any> {
    // fetch all included relations before return from Model.deserialize
    // that's why we put all fetch request into the promise bag
    const promises: Array<Promise<any>> = []
    for (const relationName of Object.keys(this.$rels)) {
      const relation = this.$rels[relationName]
      const clone = relationsToClone.includes(relationName)
      promises.push(relation.fetch(clone, false))
    }
    return Promise.all(promises)
  }

  private deserializeAttributes (attributesJson: object) {
    if (!attributesJson) {
      return
    }
    for (const name of Object.keys(attributesJson)) {
      const localName = this.class._attributeRemoteNameMap[name] || name
      if (this.hasAttr(localName)) {
        this[localName] = this.getAttrValue(localName, attributesJson[name])
      }
    }
  }

  private deserializeRelations (relationsJson: object) {
    if (!relationsJson) {
      return
    }
    for (const name of Object.keys(relationsJson)) {
      const localName = this.class._relationRemoteNameMap[name] || name
      if (this.hasRelation(localName)) {
        const relation: Relation = this.$rels[localName]
        relation.deserialize(relationsJson[name])
      }
    }
  }
}
