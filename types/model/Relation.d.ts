import IQuery from '../resource/IQuery';
import IResource from '../resource/IResource';
import ModelType from './Model';
export default class Relation {
    static HAS_ONE: string;
    static HAS_MANY: string;
    owner: ModelType;
    name: string;
    reverseName: string | ((Model) => string) | null;
    type: string;
    Model: typeof ModelType | null;
    instanceId: number;
    isClone: boolean;
    original: Relation | null;
    fetched: boolean;
    invalidated: boolean;
    id: string | null;
    itemType: string | null;
    _Query: IQuery | null;
    constructor({owner, name, reverseName, type, Model}: {
        owner: ModelType;
        name: string;
        reverseName?: string | ((Model) => string);
        type: string;
        Model?: typeof ModelType;
    });
    Query: IQuery;
    reloadOnNextGet(): void;
    getRelatedModels(): ModelType[];
    listKey(): object;
    deserialize(json: any): Promise<any>;
    refetch(): Promise<any>;
    fetch(clone: boolean, forceLoading: boolean): Promise<any>;
    /**
     * A cloned item will also have all relations cloned from it's orginal.
     * The clone item must fetch any relation on its own and hence runs its
     * own process of collecting data - fully independent from the original.
     *
     * In order to fetch the necessary resources of the original, we need to
     * copy initial data json/id as well as (for performance reasons) the
     * hint, if the relation data has already been synced to the resource cache.
     */
    clone(owner: ModelType): Relation;
    readonly info: string;
    protected readonly resource: IResource;
    private findHasOne();
    private getHasOne();
    private findHasMany();
    private getHasMany();
    private reset();
}
