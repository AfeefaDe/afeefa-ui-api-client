import ModelType from './Model';
export declare class ModelRegistry {
    private models;
    add(Model: typeof ModelType): typeof ModelType;
    initializeAll(): void;
    private checkType;
    private initializeResource;
    private initializeAttributes;
    private setupAttributes;
    private initializeRelations;
    private setupRelations;
}
declare const _default: ModelRegistry;
export default _default;
