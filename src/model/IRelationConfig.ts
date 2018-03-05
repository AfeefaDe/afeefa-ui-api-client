import Model from './Model'

export interface IRelationsConfig {
  [key: string]: IRelationConfig
}

export default interface IRelationConfig {
  type: string,
  Model: typeof Model,
  associationType?: string,
  remoteName?: string
}
