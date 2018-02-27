export default class DataTypes {
    static Boolean: {
        value(value: any): boolean;
    };
    static String: {
        value(value: any): string;
    };
    static Array: {
        value(value: any): any[];
    };
    static Date: {
        value(value: any): Date | null;
    };
    static Int: {
        value(value: any): number;
    };
    static Number: {
        value(value: any): number;
    };
    static Custom: {
        value(value: any): any;
    };
}
