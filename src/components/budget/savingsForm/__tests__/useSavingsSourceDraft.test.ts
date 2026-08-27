import { moneyFromDecimalString } from '../useSavingsSourceDraft'

describe('moneyFromDecimalString', () => {
  // The whole reason this exists. Computing nanos as
  // (parseFloat(v) - units) * 1e9 gives 989999999 for "19.99", because 19.99
  // is not representable in binary floating point — the same class of bug the
  // backend fixed in convert.go by moving to exact integer arithmetic.
  it('converts cents exactly, with no floating-point drift', () => {
    expect(moneyFromDecimalString('19.99')).toEqual({ units: 19n, nanos: 990000000 })
    expect(moneyFromDecimalString('0.10')).toEqual({ units: 0n, nanos: 100000000 })
    expect(moneyFromDecimalString('1234.56')).toEqual({ units: 1234n, nanos: 560000000 })
  })

  it('handles whole numbers and an absent fraction', () => {
    expect(moneyFromDecimalString('500')).toEqual({ units: 500n, nanos: 0 })
    expect(moneyFromDecimalString('500.')).toEqual({ units: 500n, nanos: 0 })
  })

  it('does not lose precision past two decimal places', () => {
    expect(moneyFromDecimalString('0.123456789')).toEqual({ units: 0n, nanos: 123456789 })
  })

  it('truncates rather than rounding beyond nano resolution', () => {
    expect(moneyFromDecimalString('0.1234567891')).toEqual({ units: 0n, nanos: 123456789 })
  })
})
