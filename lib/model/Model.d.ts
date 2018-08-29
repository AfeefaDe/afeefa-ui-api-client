import IQuery from '../resource/IQuery';
import Resource from '../resource/Resource';
import { IAttributesConfig, IAttributesMixedConfig } from './IAttributeConfig';
import { IRelationsConfig } from './IRelationConfig';
import Relation from './Relation';
export default class Model {
    static LEVEL: number;
    static type: string;
    static Query: IQuery;
    static Resource: typeof Resource | null;
    static ResourceUrl: string | null;
    static _relations: IRelationsConfig;
    static _attributes: IAttributesConfig;
    static _attributeRemoteNameMap: object;
    static _relationRemoteNameMap: object;
    static relations(): IRelationsConfig;
    static attributes(): IAttributesMixedConfig;
    id: string | null;
    type: string | null;
    loadingState: number;
    $rels: {
        [key: string]: Relation;
    };
    private _ID;
    private _requestId;
    private _isClone;
    private _original;
    private _lastSnapshot;
    private _parentRelations;
    private _numDeserializedAttributes;
    constructor();
    /**
     * Relations
     */
    fetchRelationsAfterGet(relationsToFullyFetch?: any[]): void;
    registerParentRelation(relation: Relation): boolean;
    getParentRelations(): Set<Relation>;
    unregisterParentRelation(relation: Relation): boolean;
    /**
     * Serialization
     */
    deserialize(json: any, requestId: number): Promise<any>;
    toJson(): object;
    serialize(): object;
    hasChanges(): boolean;
    markSaved(): void;
    clone(): Model;
    cloneWith(...relationsToClone: any[]): Model;
    readonly info: string;
    onRelationFetched(relation: Relation, data: Model | Model[] | null): void;
    readonly hasListData: boolean;
    readonly hasFullData: boolean;
    protected init(): void;
    protected beforeDeserialize(json: any): any;
    protected afterDeserializeAttributes(): void;
    protected afterDeserialize(): void;
    private guessHasOneRelationKeys;
    private countJsonKeys;
    /**
     * magic clone function :-)
     * clone anything but no model relations
     */
    private _clone;
    private readonly class;
    private hasAttr;
    private getAttrValue;
    private hasRelation;
    private fetchAllRelations;
    private fetchRelations;
    private deserializeAttributes;
    private deserializeRelations;
}
