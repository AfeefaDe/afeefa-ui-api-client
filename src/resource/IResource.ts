import Model from '../model/Model'

export default interface IResource {
  lazyLoadList: boolean

  getUrl (): string

  getListType (): string

  getListKey (): object

  getDefaultListParams (): object

  getItemType (json?: any): string

  getItemJson (json: any): any

  createItem (json: any): Model

  serializeAttachOrDetach (model: Model): string | object

  serializeAttachOrDetachMany (models: Model[]): object

  itemLoaded (model: Model)

  listLoaded (models: Model[], params?: object)

  itemAdded (model: Model)

  itemDeleted (model: Model)

  itemSaved (modelOld: Model, model: Model)

  itemAttached (model: Model)

  itemsAttached (models: Model[])

  itemDetached (model: Model)

  includedRelationInitialized (model: Model, jsonLoadingState: number)
}
