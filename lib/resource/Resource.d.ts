import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class Resource extends BaseResource {
    constructor(...params: any[]);
    /**
     * Resource Cache Access
     */
    cachePurgeList(key: any, url: any): void;
    cachePurgeRelation(relation: Relation): void;
    cachePurgeItem(key: any, id: any): void;
    cacheGetAllLists(key: any): any;
    findCachedItem(key: any, id: any): any;
}
