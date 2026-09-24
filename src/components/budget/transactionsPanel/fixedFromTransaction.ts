import type { Transaction } from '@/gen/wellspent/v1/budget_pb'

/** Whether a variable transaction can become a recurring fixed expense. */
export function canCreateFixedFromTransaction(tx: Transaction, amount: number): boolean {
  if (tx.transactionTypeId === 1) return false // Fixed is already the recurring thing
  if (tx.installmentFixedExpenseId) return false
  return amount > 0 // a negative amount is money received
}
