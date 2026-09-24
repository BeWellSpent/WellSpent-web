import { canCreateFixedFromTransaction } from '../fixedFromTransaction'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return { id: 't1', transactionTypeId: 2, installmentFixedExpenseId: '', ...overrides } as Transaction
}

describe('canCreateFixedFromTransaction', () => {
  it('allows a variable spend', () => {
    expect(canCreateFixedFromTransaction(makeTx(), 15)).toBe(true)
  })

  it('rejects a fixed transaction — already the recurring thing', () => {
    expect(canCreateFixedFromTransaction(makeTx({ transactionTypeId: 1 }), 15)).toBe(false)
  })

  it('rejects a transaction already split into installments', () => {
    expect(canCreateFixedFromTransaction(makeTx({ installmentFixedExpenseId: 'fe1' }), 15)).toBe(false)
  })

  it('rejects a received amount', () => {
    expect(canCreateFixedFromTransaction(makeTx(), -15)).toBe(false)
  })
})
