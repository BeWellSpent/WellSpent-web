import { ExpenseAllocation } from '@/gen/wellspent/v1/budget_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

/** Normalizes the C# backend's REST `ExpenseAllocation` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function expenseAllocationFromRest(dto: components['schemas']['ExpenseAllocation']): ExpenseAllocation {
  return new ExpenseAllocation({
    id: BigInt(dto.id),
    budgetProfileId: dto.budgetProfileId,
    categoryId: dto.categoryId,
    budgetPersonId: BigInt(dto.budgetPersonId),
    plannedAmount: moneyFromRest(dto.plannedAmount),
  })
}
