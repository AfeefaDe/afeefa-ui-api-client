import Relation from './Relation';
export default class ModelRelation extends Relation {
    constructor({ owner, name, type, Model }) {
        super({ owner, name, type, Model });
        this.Model = Model;
    }
}
//# sourceMappingURL=ModelRelation.js.map