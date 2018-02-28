import Model from '../model/Model';
import Resource from '../resource/Resource';
export declare class Api {
    private requestId;
    getList({resource, params}: {
        resource: Resource;
        params: any;
    }): any;
    getItem({resource, id, strategy}: {
        resource: Resource;
        id: number;
        strategy: number;
    }): any;
    saveItem({resource, item, options}: {
        resource: Resource;
        item: Model;
        options: any;
    }): any;
    addItem({resource, item, options}: {
        resource: Resource;
        item: Model;
        options: any;
    }): any;
    deleteItem({resource, item}: {
        resource: Resource;
        item: Model;
    }): any;
    updateItemAttributes({resource, item, attributes}: {
        resource: Resource;
        item: Model;
        attributes: any;
    }): any;
    private setRequestId(json, requestId?);
}
declare const _default: Api;
export default _default;
