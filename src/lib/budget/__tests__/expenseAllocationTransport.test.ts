import { expenseAllocationFromRest } from '../expenseAllocationTransport'

describe('expenseAllocationFromRest', () => {
  it('normalizes a REST allocation, converting int64 ids to bigint', () => {
    const alloc = expenseAllocationFromRest({
      id: 7, budgetProfileId: 'p1', categoryId: 3, budgetPersonId: 2,
      plannedAmount: { units: 200, nanos: 0, currency: 'USD' },
    })
    expect(alloc.id).toBe(7n)
    expect(alloc.categoryId).toBe(3)
    expect(alloc.budgetPersonId).toBe(2n)
    expect(alloc.plannedAmount?.units).toBe(200n)
  })

  it('represents an unattributed allocation with budgetPersonId 0', () => {
    const alloc = expenseAllocationFromRest({
      id: 8, budgetProfileId: 'p1', categoryId: 3, budgetPersonId: 0,
      plannedAmount: { units: 200, nanos: 0, currency: 'USD' },
    })
    expect(alloc.budgetPersonId).toBe(0n)
  })
})
