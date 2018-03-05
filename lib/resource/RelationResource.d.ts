import Model from '../model/Model';
import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    private relation;
    constructor(relation: Relation);
    protected getItemModel(): typeof Model;
}
