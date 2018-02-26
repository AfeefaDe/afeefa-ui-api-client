export default class ResourceCache {
  private cache = {}

  public purge () {
    this.cache = {}
  }

  public getCache (key) {
    if (!this.cache[key]) {
      this.cache[key] = {
        lists: {},
        items: {}
      }
    }
    return this.cache[key]
  }

  public addList (key, url, list) {
    const listCache = this.getCache(key).lists
    listCache[url] = list
    for (const item of list) {
      const cachedItem = this.getItem(item.type, item.id)
      if (cachedItem) {
        continue
      }
      this.addItem(item.type, item)
    }
  }

  public hasList (key, url) {
    return this.getCache(key).lists[url] !== undefined
  }

  public getList (key, url) {
    return this.getCache(key).lists[url]
  }

  public purgeList (key, url?) {
    if (url) {
      delete this.getCache(key).lists[url]
    } else {
      this.getCache(key).lists = {}
    }
  }

  public addItem (key, item) {
    const itemCache = this.getCache(key).items
    itemCache[item.id] = item
  }

  public hasItem (key, id?) {
    return this.getCache(key).items[id] !== undefined
  }

  public getItem (key, id) {
    return this.getCache(key).items[id]
  }

  public purgeItem (key, id) {
    delete this.getCache(key).items[id]
  }
}
