import { expect } from 'chai'
import LoadingState from 'src/api/LoadingState'

import Model from '../../src/model/Model'

describe('Model - Model', () => {
  it('creates instance with default values', () => {
    const model = new Model()
    expect(model).to.be.instanceof(Model)

    expect(model[`id`]).to.equal(null)
    expect(model[`type`]).to.equal('models')
    expect(model[`$rels`]).to.deep.equal({})

    expect(model[`_ID`]).to.be.an('number')
    expect(model[`_requestId`]).to.equal(0)
    expect(model._loadingState).to.equal(LoadingState.NOT_LOADED)
    expect(model[`_isClone`]).to.be.false()
    expect(model[`_original`]).to.be.null()
    expect(model[`_lastSnapshot`]).to.equal('')
  })

  it('hides private members in for loop', () => {
    const model: Model = new Model()
    // keys return only id and type
    expect(Object.keys(model)).to.deep.equal(['id', 'type'])
    // for .. in only over id and type
    for (const key in model) {
      if (model) { // satisfy eslint forin rule (for .. in requires filter)
        expect(['id', 'type'].includes(key)).to.be.true()
      }
    }
    // but all other props accessible
    expect(Object.getOwnPropertyNames(model).sort()).to.deep.equal([
      'id',
      'type',
      '$rels',

      '_ID',
      '_requestId',
      '_loadingState',
      '_isClone',
      '_original',
      '_parentRelations',
      '_lastSnapshot'
    ].sort())
  })

  it('does not share private members across instances', () => {
    const model: Model = new Model()
    const model2: Model = new Model()
    const model3: Model = new Model()

    expect(model2[`_ID`]).to.equal(model[`_ID`] + 1)

    model[`_ID`] = 1
    model2[`_ID`] = 2
    model3[`_ID`] = 3

    expect(model[`_ID`]).to.equal(1)
    expect(model2[`_ID`]).to.equal(2)
    expect(model3[`_ID`]).to.equal(3)

    model3[`_ID`] = 333

    expect(model[`_ID`]).to.equal(1)
    expect(model2[`_ID`]).to.equal(2)
    expect(model3[`_ID`]).to.equal(333)
  })
})
