import IQuery from '../resource/IQuery';
import ModelResource from '../resource/ModelResource';
import { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig';
import { IRelationsConfig } from './IRelationConfig';
import Relation from './Relation';
export default class Model {
    static type: string;
    static Query: IQuery;
    static Resource: typeof ModelResource | null;
    static ResourceUrl: string | null;
    static _relations: IRelationsConfig;
    static _attributes: IAttributesConfig;
    static _attributeRemoteNameMap: object;
    static _relationRemoteNameMap: object;
    id: string | null;
    type: string | null;
    $rels: {
        [key: string]: Relation;
    };
    _loadingState: number;
    private _ID;
    private _requestId;
    private _isClone;
    private _original;
    private _lastSnapshot;
    private _parentRelations;
    constructor();
    static relations(): IRelationsConfig;
    static attributes(): IAttributesMixedConfig;
    /**
     * Relations
     */
    fetchRelationsAfterGet(relationsToFullyFetch?: any[]): void;
    refetchRelation(relationName: string): void;
    registerParentRelation(relation: Relation): void;
    getParentRelations(): Set<Relation>;
    unregisterParentRelation(relation: Relation): void;
    /**
     * Serialization
     */
    deserialize(json: any): void;
    serialize(): object;
    hasChanges(): boolean;
    markSaved(): void;
    clone(): Model;
    cloneWith(...relations: any[]): Model;
    readonly info: string;
    onRelationFetched(relation: Relation, data: Model | Model[] | null): void;
    protected init(): void;
    /**
     * Inspects the given JSON and calculates a richness
     * value for the given data
     */
    protected calculateLoadingStateFromJson(json: any): number;
    protected normalizeJson(json: any): any;
    protected afterDeserializeAttributes(): void;
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    private _clone(value);
    private fetchRelation(relationName, clone, forceLoading);
    private readonly class;
    private hasAttr(name);
    private getAttrValue(name, value);
    private hasRelation(name);
    private fetchAllIncludedRelations(relationsToClone?);
    private deserializeAttributes(attributesJson);
    private deserializeRelations(relationsJson);
}
