import IDataType from './IDataType'

export default class DataTypes {
  public static Boolean: IDataType<boolean> = {
    value (value: any): boolean {
      return !!value
    }
  }

  public static String: IDataType<string> = {
    value (value): string {
      if (typeof value === 'string') {
        return value
      }
      if (typeof value === 'number') {
        return value + ''
      }
      return ''
    }
  }

  public static Array: IDataType<any[]> = {
    value (value): any[] {
      return Array.isArray(value) ? value : []
    }
  }

  public static Date: IDataType<Date | null> = {
    value (value): Date | null {
      return !isNaN(Date.parse(value)) ? new Date(value) : null
    }
  }

  public static Int: IDataType<number> = {
    value (value): number {
      return value ? (parseInt(value, 10) || 0) : 0
    }
  }

  public static Number: IDataType<number> = {
    value (value): number {
      return value ? (parseFloat(value) || 0) : 0
    }
  }

  public static Custom: IDataType<any> = {
    value (value): any {
      return value
    }
  }
}
