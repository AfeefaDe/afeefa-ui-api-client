import { Instance as App } from '../model/App';
import BaseResource from './BaseResource';
export default class Resource extends BaseResource {
    constructor() {
        super();
        this.type = '';
        const listType = this.getListType();
        if (!listType) {
            throw new Error('The resource needs to define a list type');
        }
        this._relation = App.getRelationByType(listType);
    }
    itemLoaded(_model) {
        // not supported
        // app level items can be found via API.getItem(type, id)
    }
}
//# sourceMappingURL=Resource.js.map