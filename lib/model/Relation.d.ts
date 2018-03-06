import RelationQueryType from '../resource/RelationQuery';
import ModelType from './Model';
export default class Relation {
    static HAS_ONE: string;
    static HAS_MANY: string;
    static ASSOCIATION_COMPOSITION: string;
    static ASSOCIATION_LINK: string;
    owner: ModelType;
    name: string;
    type: string;
    Model: typeof ModelType;
    instanceId: number;
    isClone: boolean;
    original: Relation | null;
    isFetching: boolean | number;
    fetched: boolean;
    invalidated: boolean;
    id: string | null;
    hasIncludedData: boolean;
    private _Query;
    constructor({owner, name, type, Model}: {
        owner: ModelType;
        name: string;
        type: string;
        Model: typeof ModelType;
    });
    Query: RelationQueryType;
    purgeFromCacheAndMarkInvalid(): void;
    listParams(): {
        owner_type: string;
        owner_id: string;
        relation: string;
    };
    deserialize(json: any): void;
    fetchHasOne(callback: any, currentItemState: any, fetchingStrategy: any): void;
    fetchHasMany(callback: any): void;
    /**
     * A cloned item will also have all relations cloned from it's orginal.
     * The clone item must fetch any relation on its own and hence runs its
     * own process of collecting data - fully independent from the original.
     *
     * In order to fetch the necessary resources of the original, we need to
     * copy initial data json/id as well as (for performance reasons) the
     * hint, if the relation data has already been synced to the resource cache.
     */
    clone(): Relation;
    readonly info: string;
    private findOrCreateItem(json);
    private reset();
}
