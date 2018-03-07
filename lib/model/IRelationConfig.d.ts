import BaseResource from '../resource/BaseResource';
import Model from './Model';
export interface IRelationsConfig {
    [key: string]: IRelationConfig;
}
export default interface IRelationConfig {
    type: string;
    Model: typeof Model;
    remoteName?: string;
    Resource: typeof BaseResource;
}
