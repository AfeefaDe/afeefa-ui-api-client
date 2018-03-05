import Model from '../model/Model';
import Relation from '../model/Relation';
import IResource from '../resource/IResource';
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
        resource: IResource;
        relation?: Relation | null;
        params: any;
    }): Promise<Model[]>;
    getItem({resource, id, strategy}: {
        resource: IResource;
        id: string;
        strategy?: number;
    }): Promise<Model | null>;
    saveItem({resource, item, options}: {
        resource: IResource;
        item: Model;
        options: {
            wrapInDataProperty?: boolean;
        };
    }): Promise<Model | null>;
    addItem({resource, item, options}: {
        resource: IResource;
        item: Model;
        options: {
            wrapInDataProperty?: boolean;
        };
    }): Promise<Model | null>;
    deleteItem({resource, item}: {
        resource: IResource;
        item: Model;
    }): Promise<boolean | null>;
    updateItemAttributes({resource, item, attributes}: {
        resource: IResource;
        item: Model;
        attributes: object;
    }): Promise<any | null>;
    private getResourceProvider(resource);
    private setRequestId(json, requestId?);
}
declare const _default: Api;
export default _default;
