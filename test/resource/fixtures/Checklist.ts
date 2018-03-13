import DataTypes from 'src/model/DataTypes'
import { IAttributesMixedConfig } from 'src/model/IAttributeConfig'
import { IRelationsConfig } from 'src/model/IRelationConfig'
import Model from 'src/model/Model'
import Registry from 'src/model/Registry'
import Relation from 'src/model/Relation'

import Todo from './Todo'

class Checklist extends Model {
  public static type = 'checklists'
  public static ResourceUrl = 'checklists'

  public static attributes (): IAttributesMixedConfig {
    return {
      title: DataTypes.String
    }
  }

  public static relations (): IRelationsConfig {
    return {
      todos: {
        type: Relation.HAS_MANY,
        Model: Todo
      }
    }
  }
}

export default Registry.add(Checklist)
