import Model from '../model/Model';
import Relation from '../model/Relation';
import IQuery from './IQuery';
import IResource from './IResource';
export default class Resource implements IResource, IQuery {
    static TYPE_RELATION: string;
    static TYPE_MODEL: string;
    static TYPE_APP: string;
    url: string;
    protected relation: Relation;
    private relationsToFetch;
    private resourceType;
    constructor(resourceType?: string, relation?: Relation);
    /**
     * IResource
     */
    getUrl(): string;
    getListType(): string;
    getListKey(): object;
    getItemType(json?: any): string;
    getItemJson(json: any): any;
    createItem(json: any): Model;
    serializeAttachOrDetach(model: Model): string | object;
    serializeAttachOrDetachMany(models: Model[]): object;
    /**
     * IQuery
     */
    with(...relations: any[]): IQuery;
    get(id?: string | null): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    attach(model: Model): Promise<boolean | null>;
    attachMany(models: Model[]): Promise<boolean | null>;
    detach(model: Model): Promise<boolean | null>;
    find(id?: string | null): Model | null;
    findAll(params?: object): Model[];
    registerRelation(model: Model): void;
    unregisterRelation(model: Model): void;
    listLoaded(_models: Model[], _params?: object): void;
    itemAdded(model: Model): void;
    itemDeleted(model: Model): void;
    itemSaved(_modelOld: Model, _model: Model): void;
    itemAttached(_model: Model): void;
    itemDetached(_model: Model): void;
    /**
     * Convenient Resource Cache Access
     */
    cachePurgeList(type: any, key?: any): void;
    cachePurgeItem(type: any, id: any): void;
    clone(relation?: Relation): Resource;
    protected getItemModel(_json: any): typeof Model;
}
