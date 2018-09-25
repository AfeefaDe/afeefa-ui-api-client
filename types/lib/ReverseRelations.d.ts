import Relation from '../model/Relation';
export default class ReverseRelations {
    static getDiff(relations1: ReverseRelations, relations2: ReverseRelations): ReverseRelations;
    private static FORCE_RELOAD;
    private relations;
    private relationParamsMap;
    toArray(): Relation[];
    add(relation: Relation, params?: string): void;
    addMany(relations: Relation[], params?: string): void;
    reloadAlways(relation: Relation): void;
    reloadOnNextGet(): void;
}
