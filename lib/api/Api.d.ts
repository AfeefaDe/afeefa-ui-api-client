import Model from '../model/Model';
import Relation from '../model/Relation';
import Resource from '../resource/Resource';
import ResourceProvider from '../resource/ResourceProvider';
import ApiError from './ApiError';
export declare class Api {
    private requestId;
    resourceProviderFactory: (_url: string) => ResourceProvider;
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
    }): Promise<Model[]>;
    getItem({resource, id, strategy}: {
        resource: Resource;
        id: string;
        strategy: number;
    }): Promise<Model | null>;
    saveItem({resource, item, options}: {
        resource: Resource;
        item: Model;
        options: {
            wrapInDataProperty?: boolean;
        };
    }): Promise<Model | null>;
    addItem({resource, item, options}: {
        resource: Resource;
        item: Model;
        options: {
            wrapInDataProperty?: boolean;
        };
    }): Promise<Model | null>;
    deleteItem({resource, item}: {
        resource: Resource;
        item: Model;
    }): Promise<boolean | null>;
    updateItemAttributes({resource, item, attributes}: {
        resource: Resource;
        item: Model;
        attributes: object;
    }): Promise<any | null>;
    private getResourceProvider(resource);
    private setRequestId(json, requestId?);
}
declare const _default: Api;
export default _default;
