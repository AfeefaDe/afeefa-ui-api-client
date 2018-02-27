export default class DataTypes {
  public static Boolean = {
    value (value) {
      return !!value
    }
  }

  public static String = {
    value (value) {
      return typeof value === 'string' ? value : ''
    }
  }

  public static Array = {
    value (value) {
      return Array.isArray(value) ? value : []
    }
  }

  public static Date = {
    value (value) {
      return !isNaN(Date.parse(value)) ? new Date(value) : null
    }
  }

  public static Int = {
    value (value) {
      return value ? (parseInt(value, 10) || 0) : 0
    }
  }

  public static Number = {
    value (value) {
      return value ? (parseFloat(value) || 0) : 0
    }
  }

  public static Custom = {
    value (value) {
      return value
    }
  }
}
