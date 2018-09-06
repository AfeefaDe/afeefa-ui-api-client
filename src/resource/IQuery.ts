import Model from '../model/Model'
import Relation from '../model/Relation'

export default interface IQuery {
  with (...relations: string[]): IQuery

  get (id?: string | null, strategy?: number): Promise<Model | null>

  reloadAll (params?: object): Promise<Model[]>

  getAll (params?: object): Promise<Model[]>

  save (model: Model): Promise<Model | null>

  updateAttributes (model: Model, attributes: object): Promise<Model | null>

  delete (model): Promise<boolean | null>

  attach (model: Model): Promise<boolean | null>

  attachMany (models: Model[]): Promise<boolean | null>

  detach (model: Model): Promise<boolean | null>

  find (id?: string | null): Model | null

  findAll (params?: object): Model[]

  select (filterFunction: (model: Model) => boolean): Model[]

  findOwners (filterFunction: (model: Model) => boolean): Model[]

  clone (relation?: Relation): IQuery
}
