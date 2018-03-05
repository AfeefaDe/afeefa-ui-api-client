import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    private relation;
    constructor(relation: Relation);
}
