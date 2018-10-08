var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import API from '../api/Api';
import LoadingState from '../api/LoadingState';
import Relation from './Relation';
var AppRelation = /** @class */ (function (_super) {
    __extends(AppRelation, _super);
    function AppRelation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AppRelation.prototype.reloadOnNextGet = function () {
        console.log('AppRelation.reloadOnNextGet', this.info);
        API.purgeList(this.resource);
        // TODO: by convention, if a app relation contains
        // only one model, that ID should be set to 'app'
        var singleModel = API.find({
            type: this.resource.getItemType(),
            id: 'app'
        });
        if (singleModel) {
            singleModel.loadingState = LoadingState.NOT_LOADED;
        }
    };
    AppRelation.prototype.listKey = function () {
        return {};
    };
    return AppRelation;
}(Relation));
export default AppRelation;
//# sourceMappingURL=AppRelation.js.map