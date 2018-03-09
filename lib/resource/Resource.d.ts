import ModelType from '../model/Model';
import BaseResource from './BaseResource';
export default class Resource extends BaseResource {
    protected type: string;
    constructor();
    itemLoaded(_model: ModelType): void;
}
