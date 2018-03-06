import Model from '../model/Model';
import IResource from './IResource';
export default class Query {
    private resource;
    private relationsToFetch;
    constructor(resource?: IResource);
    with(...relations: any[]): Query;
    get(id: any, strategy: any): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    updateAttributes(model: Model, attributes: object): Promise<any>;
    delete(model: any): Promise<boolean | null>;
    protected init(): void;
    protected getResource(): IResource;
    private clone();
}
