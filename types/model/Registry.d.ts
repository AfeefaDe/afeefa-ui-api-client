import ModelType from './Model';
export declare class ModelRegistry {
    private models;
    add(Model: typeof ModelType): typeof ModelType;
    initializeAll(): void;
    private checkType(Model);
    private initializeResource(Model);
    private initializeAttributes(Model);
    private setupAttributes(Model);
    private initializeRelations(Model);
    private setupRelations(Model);
}
declare const _default: ModelRegistry;
export default _default;
