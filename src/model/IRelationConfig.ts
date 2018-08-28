import Resource from '../resource/Resource'
import Model from './Model'

export interface IRelationsConfig {
  [key: string]: IRelationConfig
}

export default interface IRelationConfig {
  type: string,
  Model?: typeof Model,
  remoteName?: string,
  reverseName?: string | ((Model) => string),
  Resource?: typeof Resource
}
