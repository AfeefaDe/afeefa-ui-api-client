import ModelType from '../model/Model';
import Relation from '../model/Relation';
import BaseResource from './BaseResource';
export default class ModelResource extends BaseResource {
    constructor(relation: Relation);
    itemLoaded(_model: ModelType): void;
}
