import ModelType from './Model';
import Relation from './Relation';
export default class App extends ModelType {
    private static _instance;
    static readonly instance: App;
    constructor();
    getRelationByType(type: string): Relation;
    getRelationByModel(Model: typeof ModelType): Relation;
}
export declare const Instance: App;
