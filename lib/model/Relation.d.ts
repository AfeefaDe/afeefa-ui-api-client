export default class Relation {
    static HAS_ONE: string;
    static HAS_MANY: string;
    static ASSOCIATION_COMPOSITION: string;
    static ASSOCIATION_LINK: string;
    owner: any;
    name: string;
    type: any;
    Model: any;
    associationType: any;
    instanceId: any;
    isClone: boolean;
    original: any;
    isFetching: any;
    fetched: any;
    invalidated: any;
    id: any;
    hasIncludedData: any;
    constructor({owner, name, type, Model, associationType}: {
        owner: any;
        name: any;
        type: any;
        Model: any;
        associationType: any;
    });
    purgeFromCacheAndMarkInvalid(): void;
    listParams(): {
        owner_type: any;
        owner_id: any;
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
