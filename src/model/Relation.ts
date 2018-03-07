import LoadingState from '../api/LoadingState'
import LoadingStrategy from '../api/LoadingStrategy'
import resourceCache from '../cache/ResourceCache'
import IQuery from '../resource/IQuery'
import ModelType from './Model'

let ID = 0

export default class Relation {
  public static HAS_ONE = 'has_one'
  public static HAS_MANY = 'has_many'
  public static ASSOCIATION_COMPOSITION = 'composition'
  public static ASSOCIATION_LINK = 'link'

  public owner: ModelType
  public name: string
  public type: string
  public Model: typeof ModelType
  public instanceId: number
  public isClone: boolean
  public original: Relation | null
  public isFetching: boolean | number = false
  public fetched: boolean = false
  public invalidated: boolean = false

  public id: string | null = null
  public hasIncludedData: boolean = false

  private _Query: IQuery | null = null

  constructor (
    {owner, name, type, Model}:
    {owner: ModelType, name: string, type: string, Model: typeof ModelType}
  ) {
    if (!type || !Model) {
      console.error('Relation configuration invalid', ...Array.from(arguments))
    }

    this.owner = owner
    this.name = name
    this.type = type
    this.Model = Model

    this.instanceId = ++ID
    this.isClone = false
    this.original = null

    this.reset()
  }

  public set Query (query: IQuery) {
    this._Query = query
  }

  public get Query () {
    return this._Query as IQuery
  }

  public purgeFromCacheAndMarkInvalid () {
    if (this.type === Relation.HAS_ONE) {
      if (this.id) {
        resourceCache.purgeItem(this.Model.type, this.id)
      }
    } else {
      const listParams = JSON.stringify(this.listParams())
      resourceCache.purgeList(this.Model.type, listParams)
    }

    this.isFetching = false
    this.fetched = false
    this.invalidated = true

    if (this.original) {
      this.original.purgeFromCacheAndMarkInvalid()
    }
  }

  public listParams (): object {
    return {
      owner_type: this.owner.type,
      owner_id: this.owner.id,
      relation: this.name
    }
  }

  public deserialize (json: any) {
    this.reset()

    json = json.hasOwnProperty('data') ? json.data : json // jsonapi-spec fallback

    // cache item
    if (this.type === Relation.HAS_ONE) {
      // if no json given -> related object === null
      if (json) {
        this.id = json.id
        this.findOrCreateItem(json)
      }
    // cache list
    } else {
      const items: any[] = []
      json.forEach(itemJson => {
        const item = this.findOrCreateItem(itemJson)
        items.push(item)
      })
      const listParams = JSON.stringify(this.listParams())
      resourceCache.addList(this.Model.type, listParams, items)
    }

    this.hasIncludedData = true
  }

  public fetchHasOne (
    callback: (id: string | null) => Promise<any>,
    currentItemState: number,
    fetchingStrategy: number) {
    if (this.fetched) {
      // fetch again if we want do fully load but havent yet
      const wantToFetchMore = fetchingStrategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED &&
        currentItemState < LoadingState.FULLY_LOADED
      if (!wantToFetchMore) {
        return
      }
    }

    if (this.isFetching) {
      // fetch additionally if we want to fetch more detailed data
      const wantToFetchMore = fetchingStrategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED &&
        this.isFetching !== fetchingStrategy
      if (!wantToFetchMore) {
        return
      }
    }

    this.isFetching = fetchingStrategy
    callback(this.id).then(() => {
      this.isFetching = false
      this.fetched = true
      this.invalidated = false
    })
  }

  public fetchHasMany (callback: () => Promise<any>) {
    if (this.fetched) {
      return
    }

    if (this.isFetching) {
      return
    }

    this.isFetching = true
    callback().then(() => {
      this.isFetching = false
      this.fetched = true
      this.invalidated = false
    })
  }

  /**
   * A cloned item will also have all relations cloned from it's orginal.
   * The clone item must fetch any relation on its own and hence runs its
   * own process of collecting data - fully independent from the original.
   *
   * In order to fetch the necessary resources of the original, we need to
   * copy initial data json/id as well as (for performance reasons) the
   * hint, if the relation data has already been synced to the resource cache.
   */
  public clone () {
    const clone = new Relation({
      owner: this.owner,
      name: this.name,
      type: this.type,
      Model: this.Model
    })

    clone.id = this.id
    clone.hasIncludedData = this.hasIncludedData
    clone.isClone = true
    clone.original = this
    clone.Query = this.Query

    return clone
  }

  public get info () {
    const isClone = this.isClone ? '(CLONE)' : ''
    const itemId = this.type === Relation.HAS_ONE ? `itemId="${this.id}" ` : ''
    return `[Relation] id="${this.instanceId}${isClone}" owner="${this.owner.type}(${this.owner.id})" type="${this.type}" name="${this.name}" ` +
      `${itemId}hasIncludedData="${this.hasIncludedData}" fetched="${this.fetched}" invalidated="${this.invalidated}"`
  }

  private findOrCreateItem (json) {
    let item = resourceCache.getItem(this.Model.type, json.id)
    if (!item) {
      item = new this.Model()
      item.id = json.id
      resourceCache.addItem(this.Model.type, item)
    }
    item.deserialize(json)
    return item
  }

  private reset () {
    // id of a has_one relation, may be accompanied by json data but does not need to
    this.id = null

    // avoid recursions, if a relation has been cached,
    // there is no need to cache its data again,
    // even if we clone the item that holds the relation
    this.hasIncludedData = false
    this.isFetching = false
    this.fetched = false
    this.invalidated = false
  }
}
