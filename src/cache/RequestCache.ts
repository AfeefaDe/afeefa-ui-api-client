const _cache = {}

export class RequestCache {
  public addItem (key, promise) {
    _cache[key] = promise

    promise.then(result => {
      delete _cache[key]
    }).catch(e => {
      delete _cache[key]
    })
  }

  public hasItem (key) {
    return _cache[key] !== undefined
  }

  public getItem (key) {
    return _cache[key]
  }

  public purgeItem (key) {
    delete _cache[key]
  }
}

export default new RequestCache()
