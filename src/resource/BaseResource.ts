import Model from '../model/Model'
import IResource from './IResource'

export default class BaseResource implements IResource {
  public url: string = ''
  protected Model: typeof Model | null = null

  constructor (...params) {
    this.init(...params)
  }

  public init (_params?: object) {
    // hook into
  }

  public getListType (): string {
    return this.getItemType()
  }

  public getItemType (json?: any): string {
    return this.getItemModel(json).type
  }

  public getItemJson (json: any): any {
    return json
  }

  public createItem (json: any): Model {
    const item: Model = new (this.getItemModel(json))()
    item.id = json.id
    return item
  }

  public transformList (_items: Model[]) {
    // hook into
  }

  public itemAdded (_item: Model) {
    // hook into
  }

  public itemDeleted (_item: Model) {
    // hook into
  }

  public itemSaved (_itemOld: Model, _item: Model) {
    // hook into
  }

  protected getItemModel (_json: any): typeof Model {
    // hook into
    return this.Model as typeof Model
  }
}
