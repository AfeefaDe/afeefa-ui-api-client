import Model from '../model/Model';
import Relation from '../model/Relation';
import RelationResource from './RelationResource';
export default class RelationQuery {
    private relation;
    constructor(relation: Relation);
    setRelation(relation: Relation): void;
    get(id: string, strategy?: number): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    attach(model: Model): Promise<boolean | true>;
    detach(model: Model): Promise<boolean | true>;
    protected init(): void;
    protected getSaveOptions(): object;
    protected getResource(): RelationResource;
}
