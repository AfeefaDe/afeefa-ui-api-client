import AppRelation from './AppRelation';
import ModelType from './Model';
import Relation from './Relation';
var App = /** @class */ (function () {
    function App() {
        this._model = null;
    }
    Object.defineProperty(App.prototype, "model", {
        get: function () {
            if (!this._model) {
                this._model = new ModelType();
                this._model.id = '1';
                this._model.type = 'app';
            }
            return this._model;
        },
        enumerable: true,
        configurable: true
    });
    App.prototype.getRelationByType = function (type) {
        var relation = this.model.$rels[type];
        if (!relation) {
            relation = new AppRelation({
                owner: this.model,
                name: type,
                type: Relation.HAS_MANY
            });
            this.model.$rels[type] = relation;
        }
        return relation;
    };
    App.prototype.getRelationByModel = function (Model) {
        var relation = this.model.$rels[Model.type];
        if (!relation) {
            relation = new AppRelation({
                owner: this.model,
                name: Model.type,
                type: Relation.HAS_MANY,
                Model: Model
            });
            this.model.$rels[Model.type] = relation;
        }
        return relation;
    };
    return App;
}());
export { App };
export default new App();
//# sourceMappingURL=App.js.map