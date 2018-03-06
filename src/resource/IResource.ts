import Model from '../model/Model'

export default interface IResource {
  url: string

  getListType (): string

  getItemType (json?: any): string

  getItemJson (json: any): any

  createItem (json: any): Model

  transformJsonBeforeSave (json: any): any

  itemAdded (item: Model)

  itemDeleted (item: Model)

  itemSaved (itemOld: Model, item: Model)
}
