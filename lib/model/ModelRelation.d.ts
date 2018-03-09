import ModelType from './Model';
import Relation from './Relation';
export default class ModelRelation extends Relation {
    Model: typeof ModelType;
    constructor({owner, name, type, Model}: {
        owner: ModelType;
        name: string;
        type: string;
        Model: typeof ModelType;
    });
}
