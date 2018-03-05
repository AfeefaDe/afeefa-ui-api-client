import Model from '../model/Model';
import Relation from '../model/Relation';
import RelationResource from './RelationResource';
export default class RelationQuery {
    private relation;
    constructor(relation: Relation);
    setRelation(relation: Relation): void;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    protected init(): void;
    protected getSaveOptions(): object;
    protected getResource(): RelationResource;
}
