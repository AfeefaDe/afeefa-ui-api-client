import { expect } from 'chai'

import Model from '../../src/model/Model'

describe('Model - Model', () => {
  it('creates instance', () => {
    const model = new Model()
    expect(model).to.be.instanceof(Model)
  })
})
