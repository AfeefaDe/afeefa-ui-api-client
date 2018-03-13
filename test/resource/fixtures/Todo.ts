import DataTypes from 'src/model/DataTypes'
import { IAttributesMixedConfig } from 'src/model/IAttributeConfig'
import Model from 'src/model/Model'
import Registry from 'src/model/Registry'

class Todo extends Model {
  public static type = 'todos'
  public static ResourceUrl = 'todos'

  public static attributes (): IAttributesMixedConfig {
    return {
      title: DataTypes.String
    }
  }
}

export default Registry.add(Todo)
