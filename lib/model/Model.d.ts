import IQuery from '../resource/IQuery';
import Resource from '../resource/Resource';
import { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig';
import { IRelationsConfig } from './IRelationConfig';
import Relation from './Relation';
export default class Model {
    static type: string;
    static Query: IQuery | null;
    static Resource: typeof Resource | null;
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
    constructor();
    static register(ModelType: typeof Model): typeof Model;
    static initializeAll(): void;
    static relations(): IRelationsConfig;
    static attributes(): IAttributesMixedConfig;
    /**
     * Relations
     */
    fetchRelationsAfterGet(relationsToFullyFetch?: any[]): void;
    refetchRelation(relationName: string): void;
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
    private fetchRelation(relationName, clone, strategy?);
    private readonly class;
    private hasAttr(name);
    private getAttrValue(name, value);
    private hasRelation(name);
    private onRelationFetched(relation, data);
    private fetchAllIncludedRelations(relationsToClone?);
    private deserializeAttributes(attributesJson);
    private deserializeRelations(relationsJson);
}
