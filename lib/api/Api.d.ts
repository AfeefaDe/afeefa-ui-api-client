import Model from '../model/Model';
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
    getList({ resource, params }: {
        resource: IResource;
        params?: object;
    }): Promise<Model[]>;
    getItem({ resource, id }: {
        resource: IResource;
        id: string;
    }): Promise<Model | null>;
    saveItem({ resource, item }: {
        resource: IResource;
        item: Model;
    }): Promise<Model | null>;
    addItem({ resource, item }: {
        resource: IResource;
        item: Model;
    }): Promise<Model | null>;
    deleteItem({ resource, item }: {
        resource: IResource;
        item: Model;
    }): Promise<boolean | null>;
    updateItemAttributes({ resource, item, attributes }: {
        resource: IResource;
        item: Model;
        attributes: object;
    }): Promise<any | null>;
    attachItem({ resource, model }: {
        resource: IResource;
        model: Model;
    }): Promise<boolean | null>;
    attachItems({ resource, models }: {
        resource: IResource;
        models: Model[];
    }): Promise<boolean | null>;
    detachItem({ resource, model }: {
        resource: IResource;
        model: Model;
    }): Promise<boolean | null>;
    find({ resource, id }: {
        resource: IResource;
        id?: string | null;
    }): Model | null;
    findAll({ resource, params }: {
        resource: IResource;
        params?: object;
    }): Model[];
    select({ resource, filterFunction }: {
        resource: IResource;
        filterFunction: (model: Model) => boolean;
    }): Model[];
    findOwners({ resource, filterFunction }: {
        resource: IResource;
        filterFunction: (model: Model) => boolean;
    }): Model[];
    pushList({ resource, json, params }: {
        resource: IResource;
        json: any;
        params?: object;
    }): Promise<Model[]>;
    pushItem({ resource, json }: {
        resource: IResource;
        json: any;
    }): Promise<Model>;
    purgeItem(resource: IResource, id: string | null): void;
    purgeList(resource: IResource): void;
    private getListMeta;
    private getResourceProvider;
    private setRequestId;
}
declare const _default: Api;
export default _default;
