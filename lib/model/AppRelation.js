import API from '../api/Api';
import Relation from './Relation';
export default class AppRelation extends Relation {
    reloadOnNextGet() {
        API.purgeList(this.resource);
    }
    listKey() {
        return {};
    }
}
//# sourceMappingURL=AppRelation.js.map