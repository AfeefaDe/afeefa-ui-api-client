import Model from '../model/Model';
import Relation from '../model/Relation';
import Resource from './Resource';
export default class Query {
    private relationsToFetch;
    private relation;
    private resource;
    constructor();
    with(...relations: any[]): Query;
    forRelation(relation: Relation): Query;
    get(id: any, strategy: any): Promise<Model | null>;
    getAll(params: object): Promise<Model[]>;
    save(model: Model, options: object): Promise<Model | null>;
    updateAttributes(model: Model, attributes: object): Promise<any>;
    delete(model: any): Promise<boolean | null>;
    protected init(): void;
    protected getApi(): string[];
    protected getResource(params?: object): Resource;
    protected createResource(_params: object): Resource;
    private clone();
}
