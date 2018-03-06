import ModelType from '../model/Model';
import BaseResource from './BaseResource';
export default class Resource extends BaseResource {
    Model: typeof ModelType | null;
    constructor(Model: typeof ModelType);
}
