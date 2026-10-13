import { Money } from '@/gen/wellspent/v1/common_pb'
import { moneyFromRest, moneyToRest } from '../money'

describe('moneyFromRest', () => {
  it('normalizes a REST Money, converting units to bigint', () => {
    const money = moneyFromRest({ units: 1999, nanos: 990000000, currency: 'USD' })
    expect(money.units).toBe(1999n)
    expect(money.nanos).toBe(990000000)
    expect(money.currency).toBe('USD')
  })
})

describe('moneyToRest', () => {
  it('normalizes a proto Money, converting units to number', () => {
    const dto = moneyToRest(new Money({ units: 1999n, nanos: 990000000, currency: 'USD' }))
    expect(dto).toEqual({ units: 1999, nanos: 990000000, currency: 'USD' })
  })

  it('falls back to a zero amount with no currency when undefined', () => {
    expect(moneyToRest(undefined)).toEqual({ units: 0, nanos: 0, currency: '' })
  })
})
