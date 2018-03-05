import { IAttributesMixedConfig } from './IAttributeConfig';
import { IRelationsConfig } from './IRelationConfig';
import ModelType from './Model';
export declare class ModelRegistry {
    private models;
    add(name: any, Model: any): void;
    initializeAll(): void;
    getArguments(func: any): string[];
    get(name: any): any;
    checkType(Model: any): void;
    initializeQuery(Model: any): void;
    initializeAttributes(Model: typeof ModelType): void;
    setupAttributes(Model: typeof ModelType): IAttributesMixedConfig;
    initializeRelations(Model: typeof ModelType): void;
    setupRelations(Model: typeof ModelType): IRelationsConfig;
}
declare const _default: ModelRegistry;
export default _default;
