import ModelType from '../model/Model'
import BaseResource from './BaseResource'

export default class Resource extends BaseResource {
  constructor (Model: typeof ModelType) {
    super()

    this.Model = Model

    this.init()
  }
}
