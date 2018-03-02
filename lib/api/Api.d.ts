import Model from '../model/Model';
import Relation from '../model/Relation';
import Resource from '../resource/Resource';
import ApiError from './ApiError';
export declare class Api {
    private requestId;
    onGetError: (_apiError: ApiError) => null;
    onAdd: (_model: Model) => null;
    onAddError: (_apiError: ApiError) => null;
    onSave: (_oldModel: Model, _model: Model) => null;
    onSaveError: (_apiError: ApiError) => null;
    onDelete: (_model: Model) => null;
    onDeleteError: (_apiError: ApiError) => null;
    getList({resource, relation, params}: {
        resource: Resource;
        relation: Relation | null;
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
