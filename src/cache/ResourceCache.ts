import Model from '../model/Model'

export class ResourceCache {
  private cache: object = {}

  public purge () {
    this.cache = {}
  }

  public getCache (type: string) {
    if (!this.cache[type]) {
      this.cache[type] = {
        lists: {},
        items: {}
      }
    }
    return this.cache[type]
  }

  public addList (type: string, key: string, params: string, list: Model[]) {
    const listCache = this.getCache(type).lists

    if (!listCache[key]) {
      listCache[key] = {}
    }

    listCache[key][params] = list
    for (const item of list) {
      if (item.type) {
        const cachedItem = this.getItem(item.type, item.id)
        if (cachedItem) {
          continue
        }
        this.addItem(item.type, item)
      }
    }
  }

  public hasList (type: string, key: string, params: string): boolean {
    const cache = this.getCache(type).lists

    if (cache[key] === undefined) {
      return false
    }

    return cache[key][params] !== undefined
  }

  public getList (type: string, key: string, params: string): Model[] {
    const cache = this.getCache(type).lists

    if (cache[key] === undefined) {
      return []
    }

    return cache[key][params] || []
  }

  public purgeList (type: string, key?: string, params?: string) {
    const cache = this.getCache(type)
    const lists = cache.lists

    if (params && key) {
      if (lists[key]) {
        delete lists[key][params]
      }
    } else if (key) {
      delete lists[key]
    } else {
      cache.lists = {}
    }
  }

  public addItem (type, item: Model) {
    if (!item.id) {
      console.error('ResourceCache: Cannot add Item without id:', item.info)
      return
    }
    const itemCache = this.getCache(type).items
    itemCache[item.id] = item
  }

  public hasItem (type: string, id: string): boolean {
    return this.getCache(type).items[id] !== undefined
  }

  public getItem (type: string, id: string | null): Model | null {
    if (!id) {
      return null
    }
    return this.getCache(type).items[id] || null
  }

  public purgeItem (type: string, id: string) {
    delete this.getCache(type).items[id]
  }
}

export default new ResourceCache()
