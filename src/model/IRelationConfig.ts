import RelationQuery from '../resource/RelationQuery'
import Model from './Model'

export interface IRelationsConfig {
  [key: string]: IRelationConfig
}

export default interface IRelationConfig {
  type: string,
  Model: typeof Model,
  remoteName?: string,
  Query: typeof RelationQuery
}
