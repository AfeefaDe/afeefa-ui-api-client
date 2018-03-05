import IDataType from './IDataType'

export interface IAttributesMixedConfig {
  // allow short attribute definition
  // id: DataTypes.Int instead of id: { type: DataTypes.int }
  [key: string]: IAttributeConfig | IDataType<any>
}

export interface IAttributesConfig {
  [key: string]: IAttributeConfig
}

export default interface IAttributeConfig {
  type: IDataType<any>,
  default?: any,
  remoteName?: string,
  value? (value?: any): any
}
