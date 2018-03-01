export default class Query {
    private relationsToFetch;
    private owner;
    private resource;
    constructor();
    with(...relations: any[]): Query;
    forOwner(owner: any): Query;
    get(id: any, strategy: any): any;
    getAll(params: any): any;
    save(model: any, options: any): any;
    updateAttributes(model: any, attributes: any): any;
    delete(model: any): any;
    protected init(): void;
    protected getApi(): string[];
    protected getResource(params?: any): any;
    protected createResource(_params: any): void;
    private clone();
}