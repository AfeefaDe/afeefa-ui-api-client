import LoadingState from '../api/LoadingState'
import LoadingStrategy from '../api/LoadingStrategy'
import { enumerable } from '../decorator/enumerable'
import toCamelCase from '../filter/camel-case'
import DataTypes from './DataTypes'
import Relation from './Relation'

let ID = 0

export default class Model {
  public static type: string = ''

  protected static _attributes: object = {}
  protected static _relations: object = {}
  protected static _attributeRemoteNameMap: object = {}
  protected static _relationRemoteNameMap: object = {}

  public id: string = ''
  public type: string = Model.type

  @enumerable(false)
  public $rels: object = {}

  @enumerable(false)
  private _ID: number = ++ID

  @enumerable(false)
  private _loadingState: number = LoadingState.NOT_LOADED

  @enumerable(false)
  private _requestId: number = 0

  @enumerable(false)
  private _isClone: boolean = false

  @enumerable(false)
  private _original: Model | null = null

  @enumerable(false)
  private _lastSnapshot: string = ''

  constructor () {
    // init attributes
    for (const name of Object.keys(this.class._attributes)) {
      const attr = this.class._attributes[name]
      this[name] = attr.hasOwnProperty('default') ? attr.default : attr.type.value()
    }
    this.type = this.class.type

    // init relations
    for (const relationName of Object.keys(this.class._relations)) {
      const relationConfig = this.class._relations[relationName]
      this[relationName] = relationConfig.type === Relation.HAS_MANY ? [] : null
      const relation = new Relation({owner: this, name: relationName, ...relationConfig})
      this.$rels[relationName] = relation
    }

    this.init()
  }

  public static attributes () {
    return {
      id: {
        type: DataTypes.Int,
        default: null
      },

      type: {
        type: DataTypes.String,
        default: null
      }
    }
  }

  public init () {
    // pls override
  }

  /**
   * Inspects the given JSON and calculates a richness
   * value for the given data
   */
  public calculateLoadingStateFromJson (json) {
    if (!json.relationships && !json.attributes) {
      return LoadingState.NOT_LOADED
    }
    return LoadingState.FULLY_LOADED
  }

  /**
   * Attributes
   */

  public hasAttr (name) {
    return !!this.class._attributes[name]
  }

  public getAttrValue (name, value) {
    const attr = this.class._attributes[name]
    // return custom value calclulation or the default calculation of the type
    return attr.value ? attr.value(value) : attr.type.value(value)
  }

  /**
   * Relations
   */

  get relations () {
    return this.$rels
  }

  public relation (name) {
    return this.$rels[name]
  }

  public hasRelation (name) {
    return !!this.class._relations[name]
  }

  public fetchAllIncludedRelations (clone = false) {
    for (const relationName of Object.keys(this.$rels)) {
      const relation = this.$rels[relationName]
      if (relation.hasIncludedData) {
        this.fetchRelation(relationName, clone)
      }
    }
  }

  public fetchRelationsAfterGet (relationsToFullyFetch: any[] = []) {
    for (const relationName of Object.keys(this.$rels)) {
      const relation = this.$rels[relationName]
      if (relationsToFullyFetch.includes(relationName)) {
        this.fetchRelation(relationName, false, LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED)
      } else if (relation.invalidated) {
        this.fetchRelation(relationName, false)
      }
    }
  }

  public refetchRelation (relationName) {
    const relation = this.relation(relationName)
    relation.fetched = false
    this.fetchRelation(relationName, false)
  }

  public fetchRelation (relationName, clone, strategy = LoadingStrategy.LOAD_IF_NOT_CACHED) {
    const relation = this.relation(relationName)

    if (relation.fetched) {
      return
    }

    const fetchFunction = this.checkFetchFunction(relation)
    if (!fetchFunction) {
      return
    }

    if (relation.type === Relation.HAS_ONE) {
      const currentItemState = (this[relationName] && this[relationName]._loadingState) || LoadingState.NOT_LOADED
      relation.fetchHasOne(id => {
        return this[fetchFunction](relation.Model, id, clone, strategy).then(item => {
          if (item && clone && relation.associationType === Relation.ASSOCIATION_COMPOSITION) {
            item = item.clone()
          }
          this[relationName] = item // (item && clone) ? item.clone() : item
        })
      }, currentItemState, strategy)
    } else {
      relation.fetchHasMany(() => {
        return this[fetchFunction](relation.Model, clone, strategy).then(items => {
          this[relationName] = []
          items.forEach(item => {
            if (item && clone && relation.associationType === Relation.ASSOCIATION_COMPOSITION) {
              item = item.clone()
            }
            this[relationName].push(item)
          })
        })
      })
    }
  }

  public checkFetchFunction (relation) {
    const fetchFunction = 'fetch' + toCamelCase(relation.name)
    if (!this[fetchFunction]) {
      console.error('Method to fetch a relation is not defined:', fetchFunction, this.info)
      return false
    }
    return fetchFunction
  }

  /**
   * Serialization
   */

  public deserialize (json) {
    if (json._requestId === undefined) {
      console.error('No requestId given in json. Might be an error in normalizeJson()', this.info, json)
    }

    // do not deserialize if we do not have any attribute or relation data
    const jsonLoadingState = this.calculateLoadingStateFromJson(json)
    if (!jsonLoadingState) {
      return
    }

    // we do not want to deserialize our model multiple times in the same request
    // unless we really have more data (e.g. first loaded as attributes, later got list data)
    const isSameRequest = json._requestId === this._requestId
    const wantToDeserializeMore = jsonLoadingState > this._loadingState
    if (isSameRequest && !wantToDeserializeMore) {
      return
    }

    this.id = json.id

    this._requestId = json._requestId
    this._loadingState = Math.max(this._loadingState, this.calculateLoadingStateFromJson(json))

    json = this.normalizeJson(json)

    this.deserializeAttributes(json.attributes)
    this.afterDeserializeAttributes()

    this.deserializeRelations(json.relationships)

    this.fetchAllIncludedRelations()
  }

  public deserializeAttributes (attributesJson) {
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

  public deserializeRelations (relationsJson) {
    if (!relationsJson) {
      return
    }
    for (const name of Object.keys(relationsJson)) {
      const localName = this.class._relationRemoteNameMap[name] || name
      if (this.hasRelation(localName)) {
        const relation = this.$rels[localName]
        relation.deserialize(relationsJson[name])
      }
    }
  }

  public normalizeJson (json) {
    return json
  }

  public afterDeserializeAttributes () {
    // hook into
  }

  public serialize () {
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

  /**
   * magic clone function :-)
   * clone anything but no model relations
   */
  public _clone (value) {
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

    if (value && typeof value.clone === 'function') {
      console.log('has clone function', value)
      return value.clone()
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

  public clone () {
    const clone: Model = this._clone(this) as Model
    clone._isClone = true
    clone._original = this
    clone._requestId = this._requestId
    clone._loadingState = this._loadingState
    for (const relationName of Object.keys(this.$rels)) {
      clone.$rels[relationName] = this.$rels[relationName].clone()
    }
    clone.fetchAllIncludedRelations(true)
    return clone
  }

  public get info () {
    const isClone = this._isClone ? '(CLONE)' : ''
    const loadedState = ['not', 'attributes', 'list', 'full'][this._loadingState]
    return `[${this.class.name}] id="${this.id}" ID="${this._ID}${isClone}" loaded="${loadedState}" request="${this._requestId}"`
  }

  private get class (): typeof Model {
    return this.constructor as typeof Model
  }
}
