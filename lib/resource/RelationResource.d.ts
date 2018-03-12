import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    constructor(relation: Relation);
    getUrl(): string;
    getListKey(): object;
}
