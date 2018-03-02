import IResponse from './IResponse'

export default abstract class ResourceProvider {
  public abstract query (params): Promise<IResponse>
  // get item
  public abstract get ({id}: {id: string | undefined}): Promise<IResponse>
  // update item
  public abstract update ({id}: {id: string}, body: object): Promise<IResponse>
  // add item
  public abstract save ({id}: {id: string}, body: object): Promise<IResponse>
  // delete item
  public abstract delete ({id}: {id: string}): Promise<IResponse>
}
