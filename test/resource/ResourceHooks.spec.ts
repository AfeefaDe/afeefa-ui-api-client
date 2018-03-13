import { expect } from 'chai'
import sinon from 'sinon'
import API from 'src/api/Api'
import resourceCache from 'src/cache/ResourceCache'
import Model from 'src/model/Model'
import Registry from 'src/model/Registry'

import Checklist from './fixtures/Checklist'
import checklistsJson from './fixtures/checklists.json'
import Todo from './fixtures/Todo'
import todosJson from './fixtures/todos.json'

describe('Resource - Hooks', () => {
  const response = data => ({
    status: '200',
    statusText: 'ok',
    headers: [],
    body: data
  })

  const resourceProvider = {
    query () {
      return Promise.resolve(response(todosJson()))
    },
    get: () => Promise.resolve(response('')),
    update: (_id, data) => Promise.resolve(response(data)),
    save: (_id, data: any) => {
      data.id = '4'
      return Promise.resolve(response(data))
    },
    delete: () => Promise.resolve(response(''))
  }

  let querySpy
  let itemAddedSpy
  let itemDeletedSpy
  let resourceCacheSpy
  let queryStub

  beforeEach(() => {
    Registry.initializeAll()

    API.resourceProviderFactory = () => resourceProvider

    resourceCache.purge()

    itemAddedSpy = sinon.spy(Todo.Query, 'itemAdded')
    itemDeletedSpy = sinon.spy(Todo.Query, 'itemDeleted')
    resourceCacheSpy = sinon.spy(resourceCache, 'purgeItem')
  })

  afterEach(() => {
    querySpy && querySpy.restore()
    itemAddedSpy && itemAddedSpy.restore()
    itemDeletedSpy && itemDeletedSpy.restore()
    resourceCacheSpy && resourceCacheSpy.restore()
    queryStub && queryStub.restore()
  })

  it('reloads list relation on item add', () => {
    querySpy = sinon.spy(resourceProvider, 'query')

    const newTodo = new Todo()
    return Todo.Query.getAll().then(ts => {
      expect(querySpy).to.have.been.called()
    }).then(() => {
      return Todo.Query.save(newTodo)
    }).then(savedTodo => {
      expect(itemAddedSpy).to.have.been.calledWith(savedTodo)
      return Todo.Query.getAll()
    }).then(() => {
      expect(querySpy).to.have.been.calledTwice()
    })
  })

  it('removes item and reloads list relation on item delete', () => {
    querySpy = sinon.spy(resourceProvider, 'query')

    let todos
    return Todo.Query.getAll().then(ts => {
      todos = ts
      expect(querySpy).to.have.been.called()
    }).then(() => {
      return Todo.Query.delete(todos[0])
    }).then(() => {
      expect(itemDeletedSpy).to.have.been.calledWith(todos[0])
      expect(resourceCacheSpy).to.have.been.calledWith('todos', '1')
      return Todo.Query.getAll()
    }).then(() => {
      expect(querySpy).to.have.been.calledTwice()
    })
  })

  it('removes parent relations to the deleted item', () => {
    queryStub = sinon.stub(resourceProvider, 'query')
    queryStub.onCall(0).returns(Promise.resolve(response(todosJson())))
    queryStub.onCall(1).returns(Promise.resolve(response(checklistsJson())))

    let checklists
    let todos
    return Todo.Query.getAll().then(ts => {
      todos = ts
      return Checklist.Query.getAll()
    }).then(cls => {
      checklists = cls
      todos.forEach((todo: Model) => {
        expect(todo.getParentRelations().size).to.equal(2) // todos list + checklist
      })
    }).then(() => {
      return Todo.Query.delete(checklists[0])
    }).then(() => {
      expect(itemDeletedSpy).to.have.been.calledWith(checklists[0])

      checklists[0].todos.forEach((todo: Model) => {
        expect(todo.getParentRelations().size).to.equal(1) // todos list
      })
      checklists[1].todos.forEach((todo: Model) => {
        expect(todo.getParentRelations().size).to.equal(2) // todos list + checklist 2
      })
    })
  })
})
