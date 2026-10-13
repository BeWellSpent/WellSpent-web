import { Timestamp } from '@bufbuild/protobuf'
import { Transaction } from '@/gen/wellspent/v1/budget_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

type RestExpenseType = components['schemas']['ExpenseType']
type RestRecurringFrequency = components['schemas']['RecurringFrequency']

/**
 * Proto keeps `transaction_type_id`/`transaction_frequency_id` as the raw
 * lookup-table ints (migration 000001's seeded order) rather than typed
 * enums — mirrors the C# backend's own `TransactionTypeMapping`/
 * `TransactionFrequencyMapping` (`TransactionDto.cs`) index-for-index, not
 * derived independently.
 */
const TYPE_ID_FROM_REST: Record<RestExpenseType, number> = { unspecified: 0, fixed: 1, variable: 2 }
const TYPE_TO_REST: Record<1 | 2, RestExpenseType> = { 1: 'fixed', 2: 'variable' }

const FREQUENCY_ID_FROM_REST: Record<RestRecurringFrequency, number> = {
  one_off: 1, weekly: 2, bi_weekly: 3, monthly: 4, yearly: 5,
}

/** `transactionTypeId` is always 1 (Fixed) or 2 (Variable) on this client — there is no "unspecified" create/edit path. */
export function transactionTypeIdToRest(typeId: number): RestExpenseType {
  return TYPE_TO_REST[typeId as 1 | 2] ?? 'unspecified'
}

/** The web client never offers a frequency picker and always sends 1 (one_off) — see transactions.md's 2026-08-18 change log entry removing the Recurring checkbox. */
export const TRANSACTION_FREQUENCY_ONE_OFF: RestRecurringFrequency = 'one_off'

function dateFromRest(value: string | null | undefined): Timestamp | undefined {
  return value ? Timestamp.fromDate(new Date(`${value}T00:00:00Z`)) : undefined
}

/** Normalizes the C# backend's REST `Transaction` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function transactionFromRest(dto: components['schemas']['Transaction']): Transaction {
  return new Transaction({
    id: dto.id,
    name: dto.name ?? '',
    amount: moneyFromRest(dto.amount),
    plannedAmount: moneyFromRest(dto.plannedAmount),
    date: dateFromRest(dto.date),
    renewalDate: dateFromRest(dto.renewalDate),
    budgetPeriodId: dto.budgetPeriodId ?? '',
    categoryId: dto.categoryId,
    paymentMethodId: dto.paymentMethodId ?? '',
    transactionFrequencyId: FREQUENCY_ID_FROM_REST[dto.transactionFrequency],
    transactionTypeId: TYPE_ID_FROM_REST[dto.transactionType],
    isPaid: dto.isPaid,
    paidAt: dateFromRest(dto.paidAt),
    fixedExpenseId: dto.fixedExpenseId ?? '',
    isExcluded: dto.isExcluded,
    isPlaidImported: dto.isPlaidImported,
    installmentFixedExpenseId: dto.installmentFixedExpenseId ?? '',
    carriedFromBudgetPeriodId: dto.carriedFromBudgetPeriodId ?? '',
  })
}
