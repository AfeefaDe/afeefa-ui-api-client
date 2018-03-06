import requestCache from '../cache/RequestCache'
import resourceCache from '../cache/ResourceCache'
import Model from '../model/Model'
import Relation from '../model/Relation'
import IResource from '../resource/IResource'
import ResourceProvider from '../resource/ResourceProvider'
import ApiError from './ApiError'
import LoadingState from './LoadingState'
import LoadingStrategy from './LoadingStrategy'

export class Api {
  private requestId: number = 0

  public resourceProviderFactory = (_url: string): ResourceProvider => {
    return {} as ResourceProvider
  }

  public onGetError = (_apiError: ApiError) => null
  public onAdd = (_model: Model) => null
  public onAddError = (_apiError: ApiError) => null
  public onSave = (_oldModel: Model, _model: Model) => null
  public onSaveError = (_apiError: ApiError) => null
  public onDelete = (_model: Model) => null
  public onDeleteError = (_apiError: ApiError) => null

  public getList (
    {resource, relation, params}:
    {resource: IResource, relation?: Relation | null, params: any}
  ): Promise<Model[]> {
    // key of list in resource cache
    const listType = resource.getListType()

    // different caches for different list params
    const relationListParams: object = relation ? relation.listParams() : {}
    const listParams = JSON.stringify({...relationListParams, ...params}) as string

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
    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.query(params).then(response => {
      const items: any[] = []

      const data = response.body.data || response.body // jsonapi spec || afeefa api spec
      this.setRequestId(data)

      for (const json of data) {
        let item
        // update existing cached items but not replace them!
        const itemType = resource.getItemType(json)
        const itemJson = resource.getItemJson(json)
        const itemId = itemJson.id
        if (resourceCache.hasItem(itemType, itemId)) {
          item = resourceCache.getItem(itemType, itemId)
        } else {
          item = resource.createItem(json)
          resourceCache.addItem(itemType, item)
        }
        item.deserialize(itemJson)

        // add model to list
        items.push(item)
      }

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

  public getItem (
    {resource, id, strategy}:
    {resource: IResource, id: string, strategy?: number}
  ): Promise<Model | null> {
    if (!id) {
      console.debug(`API: getItem() - keine id gegeben.`)
      return Promise.resolve(null)
    }

    if (!strategy) {
      strategy = LoadingStrategy.LOAD_IF_NOT_FULLY_LOADED
    }

    const itemType = resource.getItemType()

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
    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.get({id: requestItemId}).then(response => {
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

  public saveItem (
    {resource, item}:
    {resource: IResource, item: Model}
  ): Promise<Model | null> {
    if (!item.id) {
      console.debug(`API: saveItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const itemType = resource.getItemType()
    const itemJson = item.serialize()
    const body = resource.transformJsonBeforeSave(itemJson)

    // store a deep clone of the old item
    // we do not allow saving items that are not cached beforehand
    const oldItem = resourceCache.getItem(itemType, item.id).clone()

    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.update(
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

  public addItem (
    {resource, item}:
    {resource: IResource, item: Model}
  ): Promise<Model | null> {
    const itemType = resource.getItemType()

    const itemJson = item.serialize()
    const body = resource.transformJsonBeforeSave(itemJson)

    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.save(
      {id: null}, body
    ).then(response => {
      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
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

  public deleteItem (
    {resource, item}:
    {resource: IResource, item: Model}
  ): Promise<boolean | null> {
    if (!item.id) {
      console.debug(`API: deleteItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.delete({id: item.id}).then(() => {
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

  public updateItemAttributes (
    {resource, item, attributes}:
    {resource: IResource, item: Model, attributes: object}
  ): Promise<any | null> {
    if (!item.id) {
      console.debug(`API: updateItemAttributes() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const data = {
      id: item.id,
      type: item.type,
      attributes
    }
    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.update({id: item.id}, {data}).then(response => {
      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()

      const itemType = resource.getItemType()

      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
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

  public attachItem (
    {resource, item}: {resource: IResource, item: Model}
  ): Promise<boolean | null> {
    if (!item.id) {
      console.debug(`API: attachItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.save({id: item.id}, {}).then(() => {
      return true
    }).catch(response => {
      console.log('error attaching item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
    return promise
  }

  public detachItem (
    {resource, item}: {resource: IResource, item: Model}
  ): Promise<boolean | null> {
    if (!item.id) {
      console.debug(`API: detachItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.delete({id: item.id}).then(() => {
      return true
    }).catch(response => {
      console.log('error detaching item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
    return promise
  }

  private getResourceProvider (resource: IResource): ResourceProvider {
    const url = resource.url
    return this.resourceProviderFactory(url)
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
