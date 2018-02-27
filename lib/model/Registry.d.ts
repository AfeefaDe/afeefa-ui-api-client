export declare class ModelRegistry {
    private models;
    add(name: any, Model: any): void;
    initializeAll(): void;
    getArguments(func: any): string[];
    get(name: any): any;
    checkType(Model: any): void;
    initializeQuery(Model: any): void;
    initializeAttributes(Model: any): void;
    setupAttributes(Model: any): {};
    initializeRelations(Model: any): void;
    setupRelations(Model: any): {};
}
declare const _default: ModelRegistry;
export default _default;
