import IResponse from './IResponse';
export default abstract class ResourceProvider {
    abstract query(params: any): Promise<IResponse>;
    abstract get({ id }: {
        id: string | undefined;
    }): Promise<IResponse>;
    abstract update({ id }: {
        id: string;
    }, body: object): Promise<IResponse>;
    abstract save({ id }: {
        id?: string | null;
    }, body?: object): Promise<IResponse>;
    abstract delete({ id }: {
        id?: string;
    }, body?: object): Promise<IResponse>;
}
