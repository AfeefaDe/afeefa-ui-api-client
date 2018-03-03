import { expect } from 'chai'
import LoadingState from 'src/api/LoadingState'

import Model from '../../src/model/Model'

describe('Model - Model', () => {
  it('creates instance', () => {
    const model = new Model()
    expect(model).to.be.instanceof(Model)
  })

  it('hides private members in for loop', () => {
    const model: Model = new Model()

    expect(model.hasOwnProperty('id')).to.be.true()
    expect(model.hasOwnProperty('type')).to.be.true()
    expect(Object.keys(model)).to.deep.equal(['id', 'type'])

    expect(model[`_ID`]).to.be.an('number')
    expect(model[`_requestId`]).to.equal(0)
    expect(model[`_loadingState`]).to.equal(LoadingState.NOT_LOADED)
    expect(model[`_isClone`]).to.be.false()
    expect(model[`_original`]).to.be.null()
    expect(model[`_relations`]).to.deep.equal({})
    expect(model[`_lastSnapshot`]).to.equal('')
  })

  it('does not share private members across instances', () => {
    const model: Model = new Model()
    const model2: Model = new Model()
    const model3: Model = new Model()
    model3[`_ID`] = 44444

    expect(model2[`_ID`]).to.equal(model[`_ID`] + 1)
    expect(model3[`_ID`]).to.equal(44444)
  })
})
