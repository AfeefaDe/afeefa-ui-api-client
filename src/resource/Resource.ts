import { Instance as App } from '../model/App'
import ModelType from '../model/Model'
import BaseResource from './BaseResource'

export default class Resource extends BaseResource {
  protected type: string = ''

  constructor () {
    super()

    const listType = this.getListType()
    if (!listType) {
      throw new Error('The resource needs to define a list type')
    }
    this._relation = App.getRelationByType(listType)
  }

  public itemLoaded (_model: ModelType) {
    // not supported
    // app level items can be found via API.getItem(type, id)
  }
}
