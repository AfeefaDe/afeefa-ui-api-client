import Model from '../model/Model';
import Relation from '../model/Relation';
import IQuery from './IQuery';
import IResource from './IResource';
export default class BaseResource implements IResource, IQuery {
    url: string;
    protected Model: typeof Model | null;
    protected _relation: Relation | null;
    private relationsToFetch;
    /**
     * IResource
     */
    getUrl(): string;
    getListType(): string;
    getListKey(): object;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    transformJsonBeforeSave(json: any): any;
    /**
     * IQuery
     */
    with(...relations: any[]): IQuery;
    get(id?: string | null): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    attach(model: Model): Promise<boolean | null>;
    detach(model: Model): Promise<boolean | null>;
    find(id?: string | null): Model | null;
    findAll(params?: object): Model[];
    registerRelation(model: Model): void;
    unregisterRelation(model: Model): void;
    itemAdded(model: Model): void;
    itemDeleted(model: Model): void;
    itemSaved(_modelOld: Model, _model: Model): void;
    itemAttached(_model: Model): void;
    itemDetached(_model: Model): void;
    /**
     * Convenient Resource Cache Access
     */
    findCachedItemsBy(type: string, params: object): Model[];
    cachePurgeList(type: any, key?: any): void;
    cacheGetAllLists(type: any): any;
    findCachedItem(type: any, id: any): Model | null;
    clone(relation?: Relation): BaseResource;
    protected readonly relation: Relation;
    protected getItemModel(_json: any): typeof Model;
}
