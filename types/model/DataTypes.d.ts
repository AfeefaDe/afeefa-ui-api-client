import IDataType from './IDataType';
export default class DataTypes {
    static Boolean: IDataType<boolean>;
    static String: IDataType<string>;
    static Array: IDataType<any[]>;
    static Date: IDataType<Date | null>;
    static Int: IDataType<number>;
    static Number: IDataType<number>;
    static Custom: IDataType<any>;
}
