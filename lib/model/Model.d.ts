import { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig';
import { IRelationsConfig } from './IRelationConfig';
import Relation from './Relation';
export default class Model {
    static type: string;
    static _relations: IRelationsConfig;
    static _attributes: IAttributesConfig;
    static _attributeRemoteNameMap: object;
    static _relationRemoteNameMap: object;
    id: string;
    type: string;
    $rels: {
        [key: string]: Relation;
    };
    private _ID;
    private _loadingState;
    private _requestId;
    private _isClone;
    private _original;
    private _lastSnapshot;
    constructor();
    static relations(): IRelationsConfig;
    static attributes(): IAttributesMixedConfig;
    init(): void;
    /**
     * Inspects the given JSON and calculates a richness
     * value for the given data
     */
    calculateLoadingStateFromJson(json: any): number;
    /**
     * Relations
     */
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
        id: string;
        type: string;
    };
    hasChanges(): boolean;
    markSaved(): void;
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    _clone(value: any): any;
    clone(): Model;
    readonly info: string;
    private readonly class;
    private hasAttr(name);
    private getAttrValue(name, value);
    private hasRelation(name);
}
