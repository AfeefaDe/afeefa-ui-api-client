export default class Model {
    static type: string;
    protected static _attributes: {};
    protected static _relations: {};
    protected static _attributeRemoteNameMap: {};
    protected static _relationRemoteNameMap: {};
    id: any;
    type: string;
    private _ID;
    private _loadingState;
    private _requestId;
    private _isClone;
    private _relations;
    constructor();
    static attributes(): {
        id: {
            type: {
                value(value: any): number;
            };
            default: null;
        };
        type: {
            type: {
                value(value: any): string;
            };
            default: null;
        };
    };
    init(): void;
    /**
     * Inspects the given JSON and calculates a richness
     * value for the given data
     */
    calculateLoadingStateFromJson(json: any): number;
    /**
     * Attributes
     */
    hasAttr(name: any): boolean;
    getAttrValue(name: any, value: any): any;
    /**
     * Relations
     */
    readonly relations: any;
    relation(name: any): any;
    hasRelation(name: any): boolean;
    fetchAllIncludedRelations(clone?: boolean): void;
    fetchRelationsAfterGet(relationsToFullyFetch?: any[]): void;
    refetchRelation(relationName: any): void;
    fetchRelation(relationName: any, clone: any, strategy?: number): void;
    checkFetchFunction(relation: any): string | false;
    /**
     * Serialization
     */
    deserialize(json: any): void;
    deserializeAttributes(attributesJson: any): void;
    deserializeRelations(relationsJson: any): void;
    normalizeJson(json: any): any;
    afterDeserializeAttributes(): void;
    serialize(): {
        id: any;
        type: string;
    };
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    _clone(value: any): any;
    clone(): any;
    readonly info: string;
    private readonly class;
}
