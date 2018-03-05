import Model from './Model';
export default interface IRelationConfig {
    type: string;
    Model: typeof Model;
    associationType: string;
}
