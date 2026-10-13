import { transactionFromRest, transactionTypeIdToRest } from '../transactionTransport'

describe('transactionFromRest', () => {
  it('normalizes a REST transaction, converting date-only strings to timestamps and mapping type/frequency to their lookup-table ids', () => {
    const tx = transactionFromRest({
      id: 't1', name: 'Groceries', amount: { units: 50, nanos: 0, currency: 'USD' },
      plannedAmount: { units: 50, nanos: 0, currency: 'USD' }, date: '2026-10-13', renewalDate: null,
      budgetPeriodId: 'p1', categoryId: 3, paymentMethodId: 'pm1', transactionFrequency: 'one_off',
      transactionType: 'variable', isPaid: false, paidAt: null, fixedExpenseId: null, isExcluded: false,
      isPlaidImported: false, installmentFixedExpenseId: null, carriedFromBudgetPeriodId: null,
    })
    expect(tx.date?.toDate().toISOString()).toBe('2026-10-13T00:00:00.000Z')
    expect(tx.transactionTypeId).toBe(2)
    expect(tx.transactionFrequencyId).toBe(1)
    expect(tx.renewalDate).toBeUndefined()
  })

  it('maps a fixed, weekly-paid transaction correctly and falls back empty strings for nullish ids', () => {
    const tx = transactionFromRest({
      id: 't2', name: null, amount: { units: 100, nanos: 0, currency: 'USD' },
      plannedAmount: { units: 100, nanos: 0, currency: 'USD' }, date: '2026-10-01', renewalDate: null,
      budgetPeriodId: null, categoryId: 0, paymentMethodId: null, transactionFrequency: 'weekly',
      transactionType: 'fixed', isPaid: true, paidAt: '2026-10-02', fixedExpenseId: 'fe1', isExcluded: false,
      isPlaidImported: true, installmentFixedExpenseId: null, carriedFromBudgetPeriodId: null,
    })
    expect(tx.transactionTypeId).toBe(1)
    expect(tx.transactionFrequencyId).toBe(2)
    expect(tx.paidAt?.toDate().toISOString()).toBe('2026-10-02T00:00:00.000Z')
    expect(tx.paymentMethodId).toBe('')
    expect(tx.isPlaidImported).toBe(true)
  })
})

describe('transactionTypeIdToRest', () => {
  it('maps 1 to fixed and 2 to variable', () => {
    expect(transactionTypeIdToRest(1)).toBe('fixed')
    expect(transactionTypeIdToRest(2)).toBe('variable')
  })

  it('falls back to unspecified for an unknown id', () => {
    expect(transactionTypeIdToRest(0)).toBe('unspecified')
  })
})
