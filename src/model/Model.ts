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
  public _loadingState: number = LoadingState.NOT_LOADED

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

  public deserialize (json: any): Promise<any> {
    if (json._requestId === undefined) {
      console.error('No requestId given in json. Might be an error in normalizeJson()', this.info, json)
    }

    // do not deserialize if we do not have any attribute or relation data
    const jsonLoadingState = this.calculateLoadingStateFromJson(json)
    if (!jsonLoadingState) {
      return Promise.resolve(true)
    }

    // we do not want to deserialize our model multiple times in the same request
    // unless we really have more data (e.g. first loaded as attributes, later got list data)
    const isSameRequest = json._requestId === this._requestId
    const wantToDeserializeMore = jsonLoadingState > this._loadingState
    if (isSameRequest && !wantToDeserializeMore) {
      return Promise.resolve(true)
    }

    this.id = json.id

    this._requestId = json._requestId
    this._loadingState = Math.max(this._loadingState, this.calculateLoadingStateFromJson(json))

    json = this.normalizeJson(json)

    this.deserializeAttributes(json.attributes)
    this.afterDeserializeAttributes()

    this.deserializeRelations(json.relationships)

    return this.fetchAllIncludedRelations()
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
    const loadedState = ['not', 'attributes', 'list', 'full'][this._loadingState]
    return `[${this.class.name}] id="${this.id}" ID="${this._ID}${isClone}" loaded="${loadedState}" request="${this._requestId}"`
  }

  public onRelationFetched (relation: Relation, data: Model | Model[] | null) {
    this[relation.name] = data

    const fetchHook = 'on' + toCamelCase(relation.name)
    this[fetchHook] && this[fetchHook](data)
  }

  protected init () {
    // pls override
  }

  /**
   * Inspects the given JSON and calculates a richness
   * value for the given data
   */
  protected calculateLoadingStateFromJson (json) {
    if (!json.relationships && !json.attributes) {
      return LoadingState.NOT_LOADED
    }
    return LoadingState.FULLY_LOADED
  }

  protected normalizeJson (json) {
    return json
  }

  protected afterDeserializeAttributes () {
    // hook into
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
