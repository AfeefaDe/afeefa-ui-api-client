import requestCache from '../cache/RequestCache'
import resourceCache from '../cache/ResourceCache'
import Model from '../model/Model'
import Relation from '../model/Relation'
import Resource from '../resource/Resource'
import ApiError from './ApiError'
import LoadingState from './LoadingState'
import LoadingStrategy from './LoadingStrategy'

export class Api {
  private requestId: number = 0

  public onGetError = (_apiError: ApiError) => null
  public onAdd = (_model: Model) => null
  public onAddError = (_apiError: ApiError) => null
  public onSave = (_oldModel: Model, _model: Model) => null
  public onSaveError = (_apiError: ApiError) => null
  public onDelete = (_model: Model) => null
  public onDeleteError = (_apiError: ApiError) => null

  public getList ({resource, relation, params}: {resource: Resource, relation: Relation | null, params: any}) {
    // key of list in resource cache
    const listType = resource.getListType()

    // different caches for different list params
    let listParams = relation ? relation.listParams() : {}
    listParams = JSON.stringify({...listParams, ...params})

    if (resourceCache.hasList(listType, listParams)) {
      // list already loaded
      return Promise.resolve(resourceCache.getList(listType, listParams))
    }

    if (!resource.url) {
      console.error('Keine resource.url konfiguriert', listType, listParams)
    }

    // list currently loading
    const requestKey = resource.url + (params ? JSON.stringify(params) : '')
    if (requestCache.hasItem(requestKey)) {
      return requestCache.getItem(requestKey)
    }

    // load list
    const promise = resource.http.query(params).then(response => {
      const items: any[] = []

      const data = response.body.data || response.body // jsonapi spec || afeefa api spec
      this.setRequestId(data)

      for (const json of data) {
        let item
        // update existing cached items but not replace them!
        const itemType = resource.getItemType(json)
        const itemId = resource.getItemId(json)
        if (resourceCache.hasItem(itemType, itemId)) {
          item = resourceCache.getItem(itemType, itemId)
        } else {
          item = resource.createItem(json)
          resourceCache.addItem(itemType, item)
        }
        item.deserialize(resource.getItemJson(json))

        // add model to list
        items.push(item)
      }

      // apply custom map to items, e.g. to create a category tree from a flat list
      resource.transformList(items)
      // cache list, adds all items to the cache if not yet added
      resourceCache.addList(listType, listParams, items)

      return items
    }).catch(response => {
      console.log('error loading list', response)
      this.onGetError(new ApiError(response))
      return []
    })

    // cache http call
    requestCache.addItem(requestKey, promise)
    return promise
  }

  public getItem ({resource, id, strategy}: {resource: Resource, id: string, strategy: number}) {
    if (!strategy) {
      strategy = LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED
    }

    const itemType = resource.getItemType()

    if (!id) {
      console.debug(`API: getItem(${itemType}) - keine ID gegeben.`)
      return Promise.resolve(null)
    }

    // check if item already loaded
    if (resourceCache.hasItem(itemType, id)) {
      const item = resourceCache.getItem(itemType, id)
      if (item._loadingState === LoadingState.FULLY_LOADED && strategy === LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED) {
        return Promise.resolve(resourceCache.getItem(itemType, id))
      }
      if (strategy === LoadingStrategy.LOAD_IF_NOT_CACHED) {
        return Promise.resolve(resourceCache.getItem(itemType, id))
      }
    }

    // item loading
    if (requestCache.hasItem(itemType + id)) {
      return requestCache.getItem(itemType + id)
    }

    // do not set id in request if it's a mocked id such as 'app'
    const requestItemId = parseInt(id, 10) ? id : undefined
    const promise = resource.http.get({id: requestItemId}).then(response => {
      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
      this.setRequestId(json)

      let item
      // update existing cached items but not replace them in order to keep references alive
      if (resourceCache.hasItem(itemType, id)) {
        item = resourceCache.getItem(itemType, id)
        item.deserialize(resource.getItemJson(json))
      } else {
        item = resource.createItem(json)
        resourceCache.addItem(itemType, item)
        item.deserialize(resource.getItemJson(json))
      }

      return item
    }).catch(response => {
      console.log('error loading item', response)
      this.onGetError(new ApiError(response))
      return null
    })

    // cache http call
    requestCache.addItem(itemType + id, promise)
    return promise
  }

  public saveItem ({resource, item, options = {}}: {resource: Resource, item: Model, options: any}) {
    const itemType = resource.getItemType()
    const itemJson = item.serialize()
    const body = options.wrapInDataProperty === false ? itemJson : {data: itemJson}

    // store a deep clone of the old item
    // we do not allow saving items that are not cached beforehand
    const oldItem = resourceCache.getItem(itemType, item.id).clone()

    const promise = resource.http.update(
      {id: item.id}, body
    ).then(response => {
      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()
      // get the original item for the case the given item is a clone
      item = resourceCache.getItem(itemType, item.id)
      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
      this.setRequestId(json)

      item.deserialize(resource.getItemJson(json))

      resource.itemSaved(oldItem, item)
      this.onSave(oldItem, item)
      return item
    }).catch(response => {
      console.log('error saving item', response)
      this.onSaveError(new ApiError(response))
      return null
    })

    return promise
  }

  public addItem ({resource, item, options = {}}: {resource: Resource, item: Model, options: any}) {
    const itemType = resource.getItemType()

    const itemJson = item.serialize()
    const body = options.wrapInDataProperty === false ? itemJson : {data: itemJson}

    return resource.http.save(
      {id: item.id}, body
    ).then(response => {
      const json = response.body.data || response.body
      this.setRequestId(json)

      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()
      item = resource.createItem(json)
      resourceCache.addItem(itemType, item)
      item.deserialize(resource.getItemJson(json))

      resource.itemAdded(item)
      this.onAdd(item)

      return item
    }).catch(response => {
      console.log('error adding item', response)
      this.onAddError(new ApiError(response))
      return null
    })
  }

  public deleteItem ({resource, item}: {resource: Resource, item: Model}) {
    return resource.http.delete({id: item.id}).then(() => {
      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()
      resource.itemDeleted(item)
      this.onDelete(item)
      return true
    }).catch(response => {
      console.log('error deleting item', response)
      this.onDeleteError(new ApiError(response))
      return null
    })
  }

  public updateItemAttributes ({resource, item, attributes}: {resource: Resource, item: Model, attributes: any}) {
    const data = {
      id: item.id,
      type: item.type,
      attributes
    }
    return resource.http.update({id: item.id}, {data}).then(response => {
      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()

      const itemType = resource.getItemType()

      const json = response.body.data || response.body
      this.setRequestId(json)

      const cachedItem = resourceCache.getItem(itemType, item.id)
      cachedItem.deserialize(resource.getItemJson(json))
      return attributes
    }).catch(response => {
      console.log('error updating item attribtes', response)
      this.onSaveError(new ApiError(response))
      return null
    })
  }

  private setRequestId (json, requestId?) {
    if (!requestId) {
      requestId = ++this.requestId
    }

    if (typeof json !== 'object' || json === null) {
      return
    }

    Object.defineProperty(json, '_requestId', {
      value: requestId
    })

    for (const key of Object.keys(json)) {
      this.setRequestId(json[key], requestId)
    }
  }


}

export default new Api()
