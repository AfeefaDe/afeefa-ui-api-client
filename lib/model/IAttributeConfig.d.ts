import IDataType from './IDataType';
export interface IAttributesMixedConfig {
    [key: string]: IAttributeConfig | IDataType<any>;
}
export interface IAttributesConfig {
    [key: string]: IAttributeConfig;
}
export default interface IAttributeConfig {
    type: IDataType<any>;
    default?: any;
    remoteName?: string;
    value?(value?: any): any;
}
