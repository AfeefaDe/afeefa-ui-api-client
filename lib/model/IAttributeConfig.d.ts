import IDataType from './IDataType';
export default interface IAttributeConfig {
    type: IDataType<any>;
    default: any;
    value?(value?: any): any;
}
