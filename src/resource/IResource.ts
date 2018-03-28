import Model from '../model/Model'

export default interface IResource {
  getUrl (): string

  getListType (): string

  getListKey (): object

  getItemType (json?: any): string

  getItemJson (json: any): any

  createItem (json: any): Model

  registerRelation (model: Model)

  unregisterRelation (model: Model)

  serializeAttachOrDetach (model: Model): string | object

  serializeAttachOrDetachMany (models: Model[]): object

  listLoaded (items: Model[], params?: object)

  itemAdded (item: Model)

  itemDeleted (item: Model)

  itemSaved (itemOld: Model, item: Model)

  itemAttached (item: Model)

  itemDetached (item: Model)
}
