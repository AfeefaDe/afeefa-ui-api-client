import Model from '../model/Model';
import Resource from '../resource/Resource';
import ApiError from './ApiError';
export declare class Api {
    private requestId;
    onGetError: (apiError: ApiError) => null;
    onAdd: (model: Model) => null;
    onAddError: (apiError: ApiError) => null;
    onSave: (oldModel: Model, model: Model) => null;
    onSaveError: (apiError: ApiError) => null;
    onDelete: (model: Model) => null;
    onDeleteError: (apiError: ApiError) => null;
    getList({resource, params}: {
        resource: Resource;
        params: any;
    }): any;
    getItem({resource, id, strategy}: {
        resource: Resource;
        id: string;
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
