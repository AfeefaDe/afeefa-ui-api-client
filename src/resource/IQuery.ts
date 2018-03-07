import Model from '../model/Model'

export default interface IQuery {
  with (...relations: string[]): IQuery

  get (id: string, strategy?: number): Promise<Model | null>

  getAll (params?: object): Promise<Model[]>

  save (model: Model): Promise<Model | null>

  delete (model): Promise<boolean | null>

  attach (model: Model): Promise<boolean | null>

  detach (model: Model): Promise<boolean | null>
}
