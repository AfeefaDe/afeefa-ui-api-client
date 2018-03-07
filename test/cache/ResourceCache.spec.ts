import { expect } from 'chai'

import { ResourceCache } from '../../src/cache/ResourceCache'
import Model from '../../src/model/Model'

function m ({id, type}: {id: string, type?: string}) {
  const model = new Model()
  model.id = id
  model.type = type || null
  return model
}


describe('Cache - ResourceCache', () => {
  it('creates resource cache', () => {
    const cache = new ResourceCache()
    expect(true).to.be.true()
    expect(cache).to.be.an.instanceof(ResourceCache)
    expect(cache.hasItem('randomkey', '1')).to.be.false()
  })


  it('should have and return added item', () => {
    const cache = new ResourceCache()
    const item = m({id: '1'})
    cache.addItem('type', item)
    expect(cache.hasItem('type', '1')).to.be.true()
    expect(cache.getItem('type', '1')).to.equal(item)
  })


  it('should allow multiple items', () => {
    const cache = new ResourceCache()
    const item = m({id: '1'})
    const item2 = m({id: '2'})

    cache.addItem('type', item)
    cache.addItem('type', item2)

    expect(cache.hasItem('type', '1')).to.be.true()
    expect(cache.getItem('type', '1')).to.equal(item)
    expect(cache.hasItem('type', '2')).to.be.true()
    expect(cache.getItem('type', '2')).to.equal(item2)
  })


  it('should purge item', () => {
    const cache = new ResourceCache()
    const item = m({id: '1'})
    cache.addItem('type', item)
    expect(cache.hasItem('type', '1')).to.be.true()

    cache.purgeItem('type', '1')
    expect(cache.hasItem('type', '1')).to.be.false()
  })


  it('should have and return added list', () => {
    const cache = new ResourceCache()
    const list = []
    cache.addList('type', 'key', 'params', list)
    expect(cache.hasList('type', 'key', 'params')).to.be.true()
    expect(cache.hasList('type', 'key', 'params')).to.be.true()
    expect(cache.getList('type', 'key', 'params')).to.equal(list)
  })


  it('allows multiple lists per type', () => {
    const cache = new ResourceCache()
    const list = []
    const list2 = []
    cache.addList('type', 'key1', 'params1', list)
    cache.addList('type', 'key2', 'params2', list2)
    expect(cache.hasList('type', 'key1', 'params1')).to.be.true()
    expect(cache.hasList('type', 'key2', 'params2')).to.be.true()
  })


  it('purges single list by type, key and params', () => {
    const cache = new ResourceCache()
    const list = []
    const list2 = []
    cache.addList('type', 'key1', 'params1', list)
    cache.addList('type', 'key2', 'params2', list2)
    expect(cache.hasList('type', 'key1', 'params1')).to.be.true()

    expect(cache.hasList('type', 'key2', 'params2')).to.be.true()

    cache.purgeList('type', 'key1', 'params1')
    expect(cache.hasList('type', 'key1', 'params1')).to.be.false()
    expect(cache.hasList('type', 'key2', 'params2')).to.be.true()
  })


  it('purges all lists of a given type and key', () => {
    const cache = new ResourceCache()
    const list = []
    const list2 = []
    const list3 = []
    cache.addList('type', 'key1', 'params1', list)
    cache.addList('type', 'key1', 'params2', list2)
    cache.addList('type', 'key2', 'params1', list3)
    expect(cache.hasList('type', 'key1', 'params1')).to.be.true()
    expect(cache.hasList('type', 'key1', 'params2')).to.be.true()
    expect(cache.hasList('type', 'key2', 'params1')).to.be.true()

    cache.purgeList('type', 'key1')
    expect(cache.hasList('type', 'key1', 'params1')).to.be.false()
    expect(cache.hasList('type', 'key1', 'params2')).to.be.false()
    expect(cache.hasList('type', 'key2', 'params1')).to.be.true()
  })


  it('purges all lists of a given type', () => {
    const cache = new ResourceCache()
    const list = []
    const list2 = []
    cache.addList('type', 'key1', 'params1', list)
    cache.addList('type', 'key2', 'params2', list2)
    expect(cache.hasList('type', 'key1', 'params1')).to.be.true()
    expect(cache.hasList('type', 'key2', 'params2')).to.be.true()

    cache.purgeList('type')
    expect(cache.hasList('type', 'key1', 'params1')).to.be.false()
    expect(cache.hasList('type', 'key2', 'params2')).to.be.false()
  })


  it('does not fail when purging nonexisting list', () => {
    const cache = new ResourceCache()
    cache.purgeList('type')
    cache.purgeList('type', 'key')
    cache.purgeList('type', 'key', 'params')
  })


  it('adds all items of a list', () => {
    const cache = new ResourceCache()
    const list = [
      m({id: '1', type: 'key1'}),
      m({id: '2', type: 'key1'}),
      m({id: '3', type: 'key1'}),
      m({id: '4', type: 'key2'})
    ]

    cache.addList('type', 'key', 'params', list)
    expect(cache.hasItem('key1', '1')).to.be.true()
    expect(cache.hasItem('key1', '2')).to.be.true()
    expect(cache.hasItem('key1', '3')).to.be.true()
    expect(cache.hasItem('key1', '4')).to.be.false()

    expect(cache.hasItem('key2', '3')).to.be.false()
    expect(cache.hasItem('key2', '4')).to.be.true()

    expect(cache.hasItem('list_type', '3')).to.be.false()
    expect(cache.hasItem('list_type', '4')).to.be.false()
  })
})
