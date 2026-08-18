import {
  installmentAmount,
  installmentResidue,
  defaultFirstPaymentDate,
  installmentEndDate,
  installmentPaymentsFromEndDate,
  canSplitIntoInstallments,
  toDateInputValue,
  fromDateInputValue,
} from '../installmentPlan'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return { id: 't1', transactionTypeId: 2, installmentFixedExpenseId: '', ...overrides } as Transaction
}

describe('installmentAmount', () => {
  it('splits evenly when the total divides cleanly', () => {
    expect(installmentAmount(900, 3)).toBe(300)
  })

  // The residue is structural: a fixed expense carries one planned amount that
  // every payment inherits, so no payment can absorb the difference.
  it('rounds to the nearest cent, leaving the plan a cent short', () => {
    expect(installmentAmount(1000, 3)).toBe(333.33)
    expect(installmentResidue(1000, 3)).toBe(-1)
  })

  it('rounds up when that is nearer, leaving the plan a cent over', () => {
    expect(installmentAmount(1000, 7)).toBe(142.86)
    expect(installmentResidue(1000, 7)).toBe(2)
  })

  it('reports no residue when the split is exact', () => {
    expect(installmentResidue(900, 3)).toBe(0)
  })

  it('returns zero rather than Infinity for a zero payment count', () => {
    expect(installmentAmount(1000, 0)).toBe(0)
  })
})

describe('defaultFirstPaymentDate', () => {
  // A card bills the statement after the one you bought in.
  it('is the same day of the following month', () => {
    const purchase = new Date(Date.UTC(2026, 7, 18))
    expect(toDateInputValue(defaultFirstPaymentDate(purchase))).toBe('2026-09-18')
  })

  it('rolls a December purchase into January of the next year', () => {
    const purchase = new Date(Date.UTC(2026, 11, 5))
    expect(toDateInputValue(defaultFirstPaymentDate(purchase))).toBe('2027-01-05')
  })
})

describe('installmentEndDate', () => {
  // 4 payments from September run Sep/Oct/Nov/Dec — the plan ends in December,
  // not January. An off-by-one here would spawn a whole extra payment.
  it('lands on the last payment, not one past it', () => {
    const first = new Date(Date.UTC(2026, 8, 18))
    expect(toDateInputValue(installmentEndDate(first, 4))).toBe('2026-12-18')
  })

  it('ends on itself for a single payment', () => {
    const first = new Date(Date.UTC(2026, 8, 18))
    expect(toDateInputValue(installmentEndDate(first, 1))).toBe('2026-09-18')
  })
})

describe('installmentPaymentsFromEndDate', () => {
  it('is the inverse of installmentEndDate', () => {
    const first = new Date(Date.UTC(2026, 8, 18))
    expect(installmentPaymentsFromEndDate(first, installmentEndDate(first, 6))).toBe(6)
  })

  it('spans a year boundary', () => {
    const first = new Date(Date.UTC(2026, 10, 1))
    expect(installmentPaymentsFromEndDate(first, new Date(Date.UTC(2027, 1, 1)))).toBe(4)
  })

  it('never goes below one payment when the end date precedes the first', () => {
    const first = new Date(Date.UTC(2026, 8, 18))
    expect(installmentPaymentsFromEndDate(first, new Date(Date.UTC(2026, 5, 18)))).toBe(1)
  })
})

// Mirrors the backend's guards, so the action isn't offered where the RPC
// would refuse it.
describe('canSplitIntoInstallments', () => {
  it('allows a variable spend', () => {
    expect(canSplitIntoInstallments(makeTx(), 1000)).toBe(true)
  })

  it('refuses a fixed transaction, which is already the recurring thing', () => {
    expect(canSplitIntoInstallments(makeTx({ transactionTypeId: 1 }), 1000)).toBe(false)
  })

  it('refuses a transaction that is already a plan', () => {
    expect(canSplitIntoInstallments(makeTx({ installmentFixedExpenseId: 'fe-1' }), 1000)).toBe(false)
  })

  // A negative amount is money received.
  it('refuses money received', () => {
    expect(canSplitIntoInstallments(makeTx(), -1000)).toBe(false)
  })

  it('refuses a zero amount', () => {
    expect(canSplitIntoInstallments(makeTx(), 0)).toBe(false)
  })
})

describe('date input round-trip', () => {
  it('parses what it formats', () => {
    const d = new Date(Date.UTC(2026, 8, 18))
    expect(fromDateInputValue(toDateInputValue(d))?.getTime()).toBe(d.getTime())
  })

  it('rejects malformed input rather than producing an Invalid Date', () => {
    expect(fromDateInputValue('')).toBeUndefined()
    expect(fromDateInputValue('2026-13')).toBeUndefined()
  })
})
