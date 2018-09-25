import ModelType from './Model';
import Relation from './Relation';
export declare class App {
    private _model;
    private readonly model;
    getRelationByType(type: string): Relation;
    getRelationByModel(Model: typeof ModelType): Relation;
}
declare const _default: App;
export default _default;
