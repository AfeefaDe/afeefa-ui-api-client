import API from '../api/Api'
import LoadingState from '../api/LoadingState'
import Relation from './Relation'

export default class AppRelation extends Relation {
  public reloadOnNextGet () {
    console.log('AppRelation.reloadOnNextGet', this.info)
    API.purgeList(this.resource)

    // TODO: by convention, if a app relation contains
    // only one model, that ID should be set to 'app'
    const singleModel = API.find({
      resource: this.resource,
      id: 'app'
    })
    if (singleModel) {
      singleModel.loadingState = LoadingState.NOT_LOADED
    }
  }

  public listKey (): object {
    return {}
  }
}
