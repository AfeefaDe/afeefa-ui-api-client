import toCamelCase from '@src/filter/camel-case'
import { expect } from 'chai'

describe('Filter - CamelCase', () => {
  it('camelizes', () => {
    expect(toCamelCase('a b c')).to.equal('ABC')
    expect(toCamelCase('all bll cll')).to.equal('AllBllCll')
    expect(toCamelCase('an-bo-cl')).to.equal('AnBoCl')
    expect(toCamelCase('an_bo_cl_')).to.equal('AnBoCl')
    expect(toCamelCase('an-bo_cl _')).to.equal('AnBoCl')
  })

  it('camelizes without uppercase', () => {
    expect(toCamelCase('aa bb cc', {toUpper: false})).to.equal('aaBbCc')
  })
})
