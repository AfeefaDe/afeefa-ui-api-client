import API from '../api/Api'
import Relation from './Relation'

export default class AppRelation extends Relation {
  public purgeFromCacheAndMarkInvalid () {
    API.purgeList(this.resource)
  }

  public listKey (): object {
    return {}
  }
}
