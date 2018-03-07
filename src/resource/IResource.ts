import Model from '../model/Model'

export default interface IResource {
  getUrl (): string

  getListType (): string

  getListParams (): object

  getItemType (json?: any): string

  getItemJson (json: any): any

  createItem (json: any): Model

  transformJsonBeforeSave (json: any): any

  itemAdded (item: Model)

  itemDeleted (item: Model)

  itemSaved (itemOld: Model, item: Model)

  itemAttached (item: Model)

  itemDetached (item: Model)
}
