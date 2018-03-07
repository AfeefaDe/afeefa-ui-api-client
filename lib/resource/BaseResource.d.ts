import Model from '../model/Model';
import Relation from '../model/Relation';
import IQuery from './IQuery';
import IResource from './IResource';
export default class BaseResource implements IResource, IQuery {
    protected url: string;
    protected Model: typeof Model | null;
    private relationsToFetch;
    /**
     * IResource
     */
    getUrl(): string;
    getListType(): string;
    getListParams(): object;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    transformJsonBeforeSave(json: any): any;
    itemAdded(model: Model): void;
    itemDeleted(model: Model): void;
    itemSaved(_modelOld: Model, _model: Model): void;
    itemAttached(_model: Model): void;
    itemDetached(_model: Model): void;
    /**
     * IQuery
     */
    with(...relations: any[]): IQuery;
    get(id: string, strategy?: number): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    attach(model: Model): Promise<boolean | null>;
    detach(model: Model): Promise<boolean | null>;
    /**
     * Convenient Resource Cache Access
     */
    cachePurgeList(key: any, url?: any): void;
    cachePurgeRelation(relation: Relation): void;
    cachePurgeItem(key: any, id: any): void;
    cacheGetAllLists(key: any): any;
    findCachedItem(key: any, id: any): any;
    protected init(): void;
    protected getItemModel(_json: any): typeof Model;
    protected clone(): BaseResource;
}
