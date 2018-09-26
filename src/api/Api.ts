import requestCache from '../cache/RequestCache'
import resourceCache, { IResourceCacheItem, IResourceCacheList } from '../cache/ResourceCache'
import Model from '../model/Model'
import IResource from '../resource/IResource'
import ResourceProvider from '../resource/ResourceProvider'
import ApiError from './ApiError'
import LoadingState from './LoadingState'

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
    {resource, params}:
    {resource: IResource, params?: {[key: string]: any}}
  ): Promise<Model[]> {
    const {listType, listKey, listParams} = this.getListMeta(resource, params)

    // check if ids are given and we already loaded models for that id
    if (params && params.ids) {
      params.ids = params.ids.filter(id => {
        const item = resourceCache.getItem(listType, id)
        return !item || item.loadingState < LoadingState.LIST_DATA_LOADED
      })
      if (!params.ids.length) {
        return Promise.resolve([])
      }
    }

    if (resourceCache.hasList(listType, listKey, listParams)) {
      // list already loaded
      return Promise.resolve(resourceCache.getList(listType, listKey, listParams))
    }

    if (!resource.getUrl()) {
      console.error('Keine resource.url konfiguriert', listType, listParams)
    }

    // list currently loading
    const requestKey = resource.getUrl() + (params ? JSON.stringify(params) : '')
    if (requestCache.hasItem(requestKey)) {
      return requestCache.getItem(requestKey)
    }

    // load list
    const resourceProvider = this.getResourceProvider(resource)
    const promise = resourceProvider.query(params).then(response => {
      this.setRequestId()

      const data = response.body.data || response.body // jsonapi spec || afeefa api spec
      const skipCachingList = params && params.ids
      return this.pushList({resource, json: data, params, skipCachingList}).then(items => {
        items.forEach(item => {
          if (resource.lazyLoadList && (!params || !params.ids)) {
            if (item.loadingState < LoadingState.ATTRIBUTES_LOADED) {
              item.loadingState = LoadingState.ATTRIBUTES_LOADED
            }
          } else {
            if (item.loadingState < LoadingState.LIST_DATA_LOADED) {
              item.loadingState = LoadingState.LIST_DATA_LOADED
            }
          }
        })
        resource.listLoaded(items, params)
        return items
      })
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
    {resource, type, id}:
    {resource: IResource, type: string, id: string}
  ): Promise<Model | null> {
    if (!id) {
      console.debug(`API: getItem() - keine id gegeben.`)
      return Promise.resolve(null)
    }

    const itemType = type

    // check if item already loaded
    if (resourceCache.hasItem(itemType, id)) {
      const item = resourceCache.getItem(itemType, id) as Model
      if (item.loadingState === LoadingState.FULLY_LOADED) {
        return Promise.resolve(resourceCache.getItem(itemType, id) as Model)
      }
    }

    // item loading
    if (requestCache.hasItem(itemType + id)) {
      return requestCache.getItem(itemType + id)
    }

    // do not set id in request if it's a mocked id such as 'app'
    const resourceProvider = this.getResourceProvider(resource)
    const requestItemId = parseInt(id, 10) ? id : undefined
    const promise = resourceProvider.get({id: requestItemId}).then(response => {
      this.setRequestId()

      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
      return this.pushItem({resource, json}).then(item => {
        item.loadingState = LoadingState.FULLY_LOADED
        resource.itemLoaded(item)
        return item
      })
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

    // store a deep clone of the old item
    // we do not allow saving items that are not cached beforehand
    const itemType = resource.getItemType()
    const oldItem = (resourceCache.getItem(itemType, item.id) as Model).clone()

    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.update({id: item.id}, item.toJson()).then(response => {
      this.setRequestId()

      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()

      // get the original item for the case the given item is a clone
      item = resourceCache.getItem(itemType, item.id) as Model
      const json = response.body.data || response.body // jsonapi spec || afeefa api spec

      return item.deserialize(json, this.requestId).then(() => {
        resource.itemSaved(oldItem, item)
        this.onSave(oldItem, item)
        return item
      })
    }).catch(response => {
      console.log('error saving item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
  }

  public addItem (
    {resource, item}:
    {resource: IResource, item: Model}
  ): Promise<Model | null> {
    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.save({id: null}, item.toJson()).then(response => {
      this.setRequestId()

      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()

      const json = response.body.data || response.body // jsonapi spec || afeefa api spec
      return this.pushItem({resource, json}).then(addedItem => {
        addedItem.loadingState = LoadingState.FULLY_LOADED
        resource.itemAdded(addedItem)
        this.onAdd(addedItem)
        return addedItem
      })
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

      this.purgeItem(item.type as string, item.id)
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

    const resourceProvider = this.getResourceProvider(resource)
    return resourceProvider.update({id: item.id}, item.attributesToJson(attributes)).then(response => {
      this.setRequestId()

      // reset all tracked changes in order to force item.hasChanges to return false after save
      item.markSaved()

      const json = response.body.data || response.body // jsonapi spec || afeefa api spec

      const itemType = resource.getItemType()
      const cachedItem = resourceCache.getItem(itemType, item.id)
      if (cachedItem) {
        // tslint:disable-next-line no-floating-promises
        cachedItem.deserialize(json, this.requestId)
      }
      return attributes
    }).catch(response => {
      console.log('error updating item attribtes', response)
      this.onSaveError(new ApiError(response))
      return null
    })
  }

  public attachItem (
    {resource, model}: {resource: IResource, model: Model}
  ): Promise<boolean | null> {
    if (!model.id) {
      console.debug(`API: attachItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const resourceProvider = this.getResourceProvider(resource)
    const data = resource.serializeAttachOrDetach(model)
    const id = typeof data === 'object' ? {} : {id: data}
    const payload = typeof data === 'object' ? data : {}
    const promise = resourceProvider.save(id, payload).then(() => {
      resource.itemAttached(model)
      return true
    }).catch(response => {
      console.log('error attaching item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
    return promise
  }

  public attachItems (
    {resource, models}: {resource: IResource, models: Model[]}
  ): Promise<boolean | null> {
    const resourceProvider = this.getResourceProvider(resource)
    const data = resource.serializeAttachOrDetachMany(models)
    const promise = resourceProvider.save({}, data).then(() => {
      resource.itemsAttached(models)
      return true
    }).catch(response => {
      console.log('error attaching item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
    return promise
  }

  public detachItem (
    {resource, model}: {resource: IResource, model: Model}
  ): Promise<boolean | null> {
    if (!model.id) {
      console.debug(`API: detachItem() - keine item.id gegeben.`)
      return Promise.resolve(null)
    }

    const resourceProvider = this.getResourceProvider(resource)
    const data = resource.serializeAttachOrDetach(model)
    const id = typeof data === 'object' ? {} : {id: data}
    const payload = typeof data === 'object' ? data : {}
    const promise = resourceProvider.delete(id, payload).then(() => {
      resource.itemDetached(model)
      return true
    }).catch(response => {
      console.log('error detaching item', response)
      this.onSaveError(new ApiError(response))
      return null
    })
    return promise
  }

  public find ({type, id}: {type?: string, id?: string | null}): Model | null {
    if (!type || !id) {
      return null
    }
    return resourceCache.getItem(type, id)
  }

  public findAll ({resource, params}: {resource: IResource, params?: object}): Model[] {
    const {listType, listKey, listParams} = this.getListMeta(resource, params)
    return resourceCache.getList(listType, listKey, listParams)
  }

  public select ({resource, filterFunction}: {resource: IResource, filterFunction: (model: Model) => boolean}): Model[] {
    const itemType = resource.getItemType()
    const items: IResourceCacheItem[] = resourceCache.getItems(itemType)
    return Object.keys(items).map(id => items[id]).filter(filterFunction)
  }

  public findOwners ({resource, filterFunction}: {resource: IResource, filterFunction: (model: Model) => boolean}): Model[] {
    const itemType = resource.getItemType()
    const lists: IResourceCacheList[] = resourceCache.getLists(itemType)
    const owners: Model[] = []
    Object.keys(lists).forEach((key: any) => {
      const {owner_type, owner_id} = JSON.parse(key)
      if (owner_type) {
        const paramObject = lists[key]
        Object.keys(paramObject).forEach(params => {
          const models: Model[] = paramObject[params]
          models.forEach(model => {
            const res = filterFunction(model)
            if (res) {
              const owner: Model | null = resourceCache.getItem(owner_type, owner_id)
              if (owner && !owners.includes(owner)) {
                owners.push(owner)
              }
            }
          })
        })
      }
    })
    return owners
  }

  public pushList ({resource, json, params, skipCachingList}: {resource: IResource, json: any, params?: object, skipCachingList?: boolean}): Promise<Model[]> {
    const {listType, listKey, listParams} = this.getListMeta(resource, params)

    const items: Model[] = []
    let promise: Promise<any> = Promise.resolve()
    for (const itemJson of json) {
      promise = promise.then(() => {
        return this.pushItem({resource, json: itemJson}).then(item => {
          items.push(item)
        })
      })
    }

    return promise.then(() => {
      if (!skipCachingList) {
        resourceCache.addList(listType, listKey, listParams, items)
      }
      return items
    })
  }

  public pushItem ({resource, json}: {resource: IResource, json: any}): Promise<Model> {
    json = resource.getItemJson(json)
    const itemType = resource.getItemType(json)
    const itemId = json.id

    let item: Model
    // update existing cached items but not replace them in order to keep references alive
    if (resourceCache.hasItem(itemType, itemId)) {
      item = resourceCache.getItem(itemType, itemId) as Model
    } else {
      item = resource.createItem(json)
      resourceCache.addItem(itemType, item)
    }

    return item.deserialize(json, this.requestId).then(() => {
      return item
    })
  }

  public purgeItem (type: string, id: string | null) {
    if (id) {
      // console.log('purge item', type, id)
      resourceCache.purgeItem(type, id)
    }
  }

  public purgeList (resource: IResource) {
    const {listType, listKey} = this.getListMeta(resource)
    // console.log('purge list', listType, listKey, resource)
    resourceCache.purgeList(listType, listKey)
  }

  private getListMeta (resource: IResource, params?: object): any {
    const listType = resource.getListType()
    const listKey = JSON.stringify(resource.getListKey())
    const listParams = JSON.stringify(params || resource.getDefaultListParams() || {})
    return {listType, listKey, listParams}
  }

  private getResourceProvider (resource: IResource): ResourceProvider {
    const url = resource.getUrl()
    return this.resourceProviderFactory(url)
  }

  private setRequestId () {
    return ++this.requestId
  }
}

export default new Api()
