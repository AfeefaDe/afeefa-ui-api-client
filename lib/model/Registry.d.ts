import ModelType from './Model';
export declare class ModelRegistry {
    private models;
    register(Model: typeof ModelType): typeof ModelType;
    initializeAll(): void;
    private checkType(Model);
    private initializeQuery(Model);
    private initializeAttributes(Model);
    private setupAttributes(Model);
    private initializeRelations(Model);
    private setupRelations(Model);
}
declare const _default: ModelRegistry;
export default _default;
