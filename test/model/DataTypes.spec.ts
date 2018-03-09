import { expect } from 'chai'

import DataTypes from '../../src/model/DataTypes'

describe('Model - DataTypes', () => {
  it('returns boolean value', () => {
    expect(DataTypes.Boolean.value('test')).to.be.true()
    expect(DataTypes.Boolean.value('true')).to.be.true()
    expect(DataTypes.Boolean.value(true)).to.be.true()
    expect(DataTypes.Boolean.value(1)).to.be.true()

    expect(DataTypes.Boolean.value(null)).to.be.false()
    expect(DataTypes.Boolean.value(false)).to.be.false()
    expect(DataTypes.Boolean.value('')).to.be.false()
    expect(DataTypes.Boolean.value(undefined)).to.be.false()
  })

  it('returns string value', () => {
    expect(DataTypes.String.value('test')).to.be.equal('test')
    expect(DataTypes.String.value(undefined)).to.be.equal('')
    expect(DataTypes.String.value(null)).to.be.equal('')
    expect(DataTypes.String.value('')).to.be.equal('')
    expect(DataTypes.String.value(true)).to.be.equal('')
    expect(DataTypes.String.value(8)).to.be.equal('8')
    expect(DataTypes.String.value(1.8)).to.be.equal('1.8')
  })

  it('returns array value', () => {
    expect(DataTypes.Array.value('test')).to.deep.equal([])
    expect(DataTypes.Array.value(undefined)).to.deep.equal([])
    expect(DataTypes.Array.value(null)).to.deep.equal([])
    expect(DataTypes.Array.value('')).to.deep.equal([])
    expect(DataTypes.Array.value([])).to.deep.equal([])
    expect(DataTypes.Array.value(['a'])).to.deep.equal(['a'])
  })

  it('returns date value', () => {
    expect(DataTypes.Date.value('test')).to.equal(null)
    expect(DataTypes.Date.value(undefined)).to.equal(null)
    expect(DataTypes.Date.value(null)).to.equal(null)
    expect(DataTypes.Date.value('')).to.equal(null)
    expect(DataTypes.Date.value([])).to.equal(null)
    expect(DataTypes.Date.value(['a'])).to.equal(null)

    const validDate = DataTypes.Date.value('Tue Feb 27 2018 09:18:35 GMT+0100 (CET)')
    expect(validDate && validDate.toString()).to.equal('Tue Feb 27 2018 09:18:35 GMT+0100 (CET)')
  })

  it('returns int value', () => {
    expect(DataTypes.Int.value('test')).to.be.equal(0)
    expect(DataTypes.Int.value(undefined)).to.be.equal(0)
    expect(DataTypes.Int.value(null)).to.be.equal(0)
    expect(DataTypes.Int.value('')).to.be.equal(0)
    expect(DataTypes.Int.value(true)).to.be.equal(0)
    expect(DataTypes.Int.value(1)).to.be.equal(1)
    expect(DataTypes.Int.value(1.6)).to.be.equal(1)
    expect(DataTypes.Int.value('1')).to.be.equal(1)
    expect(DataTypes.Int.value('1.00')).to.be.equal(1)
    expect(DataTypes.Int.value('1.40')).to.be.equal(1)
  })

  it('returns numeric value', () => {
    expect(DataTypes.Number.value('test')).to.be.equal(0)
    expect(DataTypes.Number.value(undefined)).to.be.equal(0)
    expect(DataTypes.Number.value(null)).to.be.equal(0)
    expect(DataTypes.Number.value('')).to.be.equal(0)
    expect(DataTypes.Number.value(true)).to.be.equal(0)
    expect(DataTypes.Number.value(1)).to.be.equal(1)
    expect(DataTypes.Number.value(1.6)).to.be.equal(1.6)
    expect(DataTypes.Number.value('1')).to.be.equal(1)
    expect(DataTypes.Number.value('1.00')).to.be.equal(1)
    expect(DataTypes.Number.value('1.40')).to.be.equal(1.4)
  })

  it('returns custom value', () => {
    expect(DataTypes.Custom.value('test')).to.be.equal('test')
    expect(DataTypes.Custom.value(undefined)).to.be.undefined()
    expect(DataTypes.Custom.value(null)).to.be.null()
    expect(DataTypes.Custom.value('')).to.be.equal('')
    expect(DataTypes.Custom.value(true)).to.be.true()
    expect(DataTypes.Custom.value(1)).to.be.equal(1)
    expect(DataTypes.Custom.value('1.40')).to.be.equal('1.40')
    expect(DataTypes.Custom.value([])).to.deep.equal([])
    expect(DataTypes.Custom.value({})).to.deep.equal({})
  })
})
