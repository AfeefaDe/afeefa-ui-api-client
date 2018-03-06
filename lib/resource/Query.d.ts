import Model from '../model/Model';
import Resource from './Resource';
export default class Query {
    private relationsToFetch;
    constructor();
    with(...relations: any[]): Query;
    get(id: any, strategy: any): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    updateAttributes(model: Model, attributes: object): Promise<any>;
    delete(model: any): Promise<boolean | null>;
    protected init(): void;
    protected getResource(): Resource;
    private clone();
}
