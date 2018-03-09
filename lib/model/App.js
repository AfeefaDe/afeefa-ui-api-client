import AppRelation from './AppRelation';
import ModelType from './Model';
import Relation from './Relation';
export default class App extends ModelType {
    static get instance() {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }
    constructor() {
        super();
        this.id = '1';
        this.type = 'app';
    }
    getRelationByType(type) {
        let relation = this.$rels[type];
        if (!relation) {
            relation = new AppRelation({
                owner: this,
                name: type,
                type: Relation.HAS_MANY
            });
            this.$rels[type] = relation;
        }
        return relation;
    }
    getRelationByModel(Model) {
        let relation = this.$rels[Model.type];
        if (!relation) {
            relation = new AppRelation({
                owner: this,
                name: Model.type,
                type: Relation.HAS_MANY,
                Model
            });
            this.$rels[Model.type] = relation;
        }
        return relation;
    }
}
export const Instance = App.instance;
//# sourceMappingURL=App.js.map