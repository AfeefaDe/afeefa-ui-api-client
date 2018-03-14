import Model from '../model/Model';
import Relation from '../model/Relation';
export default interface IQuery {
    with(...relations: string[]): IQuery;
    get(id?: string | null, strategy?: number): Promise<Model | null>;
    getAll(params?: object): Promise<Model[]>;
    save(model: Model): Promise<Model | null>;
    delete(model: any): Promise<boolean | null>;
    attach(model: Model): Promise<boolean | null>;
    detach(model: Model): Promise<boolean | null>;
    hasItem(id?: string | null): boolean;
    find(id?: string | null): Model | null;
    hasList(params?: object): boolean;
    findAll(params?: object): Model[];
    clone(relation?: Relation): IQuery;
}
