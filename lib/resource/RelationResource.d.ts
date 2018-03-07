import Model from '../model/Model';
import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class RelationResource extends BaseResource {
    private relation;
    constructor(relation: Relation);
    getUrl(): string;
    /**
     * IResource
     */
    getListParams(): object;
    itemAdded(_model: Model): void;
    itemDeleted(_model: Model): void;
    itemSaved(_modelOld: Model, _model: Model): void;
    itemAttached(_model: Model): void;
    itemDetached(_model: Model): void;
    protected clone(): BaseResource;
}
