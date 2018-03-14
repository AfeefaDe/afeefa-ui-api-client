import API from '../api/Api'
import IQuery from '../resource/IQuery'
import IResource from '../resource/IResource'
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
  public Model: typeof ModelType | null = null

  public instanceId: number
  public isClone: boolean
  public original: Relation | null
  public fetched: boolean = false
  public invalidated: boolean = false

  public id: string | null = null
  public _Query: IQuery | null = null

  constructor (
    {owner, name, type, Model}:
    {owner: ModelType, name: string, type: string, Model?: typeof ModelType}
  ) {
    if (!type) {
      console.error('Relation configuration invalid', ...Array.from(arguments))
    }

    this.owner = owner
    this.name = name
    this.type = type
    this.Model = Model || null

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

  public reloadOnNextGet () {
    if (this.original) {
      this.original.reloadOnNextGet()
      return
    }

    if (this.type === Relation.HAS_ONE) {
      API.purgeItem(this.resource, this.id)
    } else {
      API.purgeList(this.resource)
    }

    this.fetched = false
    this.invalidated = true
  }

  public getRelatedModels (): ModelType[] {
    if (this.type === Relation.HAS_ONE) {
      const model: ModelType = this.owner[this.name]
      if (model) {
        return [model]
      }
    } else {
      return this.owner[this.name]
    }
    return []
  }

  public listKey (): object {
    return {
      owner_type: this.owner.type,
      owner_id: this.owner.id,
      relation: this.name
    }
  }

  public deserialize (json: any) {
    this.reset()

    // { data: null } is valid
    json = json.hasOwnProperty('data') ? json.data : json // jsonapi-spec fallback

    // cache item
    if (this.type === Relation.HAS_ONE) {
      // if no json given -> related object === null
      if (json) {
        const item = API.pushItem({resource: this.resource, json})
        // store the id
        this.id = item.id
      }
    // cache list
    } else {
      API.pushList({resource: this.resource, json, params: {}})
    }
  }

  public fetch (clone: boolean, forceLoading: boolean): Promise<any> {
    if (this.fetched) {
      return Promise.resolve(true)
    }

    let promise: Promise<any>
    if (this.type === Relation.HAS_ONE) {
      if (!forceLoading && !this.Query.hasItem()) {
        return Promise.resolve(true)
      }
      promise = (forceLoading ? this.getHasOne() : this.findHasOne()).then((model: ModelType | null) => {
        if (model && clone) {
          model = model.clone()
        }
        return model
      })
    } else {
      if (!forceLoading && !this.Query.hasList()) {
        return Promise.resolve(true)
      }
      promise = (forceLoading ? this.getHasMany() : this.findHasMany()).then((items: ModelType[]) => {
        const models: ModelType[] = []
        items.forEach(item => {
          if (item && clone) {
            item = item.clone()
          }
          models.push(item)
        })
        return models
      })
    }

    return promise.then(result => {
      this.fetched = true
      this.invalidated = false
      this.owner.onRelationFetched(this, result)
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
  public clone (owner: ModelType) {
    const clone = new Relation({
      owner,
      name: this.name,
      type: this.type,
      Model: this.Model || undefined
    })

    clone.id = this.id
    clone.isClone = true
    clone.original = this
    // clone resource with our cloned relation
    clone.Query = this.Query.clone(clone)

    return clone
  }

  public get info () {
    const isClone = this.isClone ? '(CLONE)' : ''
    const itemId = this.type === Relation.HAS_ONE ? `itemId="${this.id}" ` : ''
    return `[Relation] id="${this.instanceId}${isClone}" owner="${this.owner.type}(${this.owner.id})" type="${this.type}" name="${this.name}" ` +
      `${itemId}fetched="${this.fetched}" invalidated="${this.invalidated}"`
  }

  protected get resource (): IResource {
    return (this._Query as any) as IResource
  }

  private findHasOne (): Promise<ModelType | null> {
    return Promise.resolve(this.Query.find())
  }

  private getHasOne (): Promise<ModelType | null> {
    return this.Query.get(this.id)
  }

  private findHasMany (): Promise<ModelType[]> {
    return Promise.resolve(this.Query.findAll())
  }

  private getHasMany (): Promise<ModelType[]> {
    return this.Query.getAll()
  }

  private reset () {
    // id of a has_one relation, may be accompanied by json data but does not need to
    this.id = null

    this.fetched = false
    this.invalidated = false
  }
}
