import { Instance as App } from '../model/App'
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
}
