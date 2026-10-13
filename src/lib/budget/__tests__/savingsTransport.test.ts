import { RecurringType } from '@/gen/wellspent/v1/common_pb'
import { savingsSourceFromRest } from '../savingsTransport'

describe('savingsSourceFromRest', () => {
  it('normalizes a REST savings source, converting int64 ids to bigint and the derived frequency string to an enum', () => {
    const source = savingsSourceFromRest({
      id: 3, budgetProfileId: 'p1', name: 'Emergency fund',
      amount: { units: 200, nanos: 0, currency: 'USD' },
      frequency: 'bi_weekly', isTaxReserve: false, budgetPersonId: 1,
      paymentMethodId: 'pm1', paymentDays: [1, 15],
    })
    expect(source.id).toBe(3n)
    expect(source.frequency).toBe(RecurringType.BI_WEEKLY)
    expect(source.budgetPersonId).toBe(1n)
    expect(source.paymentMethodId).toBe('pm1')
    expect(source.paymentDays).toEqual([1, 15])
  })

  it('falls back to empty paymentMethodId and UNSPECIFIED frequency for nullish/unrecognized values', () => {
    const source = savingsSourceFromRest({
      id: 4, budgetProfileId: 'p1', name: 'Tax reserve',
      amount: { units: 300, nanos: 0, currency: 'USD' },
      frequency: 'monthly', isTaxReserve: true, budgetPersonId: 1,
      paymentMethodId: null, paymentDays: [],
      federalAmount: { units: 100, nanos: 0, currency: 'USD' },
    })
    expect(source.paymentMethodId).toBe('')
    expect(source.federalAmount?.units).toBe(100n)
    expect(source.stateAmount).toBeUndefined()
  })
})
