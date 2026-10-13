import { Timestamp } from '@bufbuild/protobuf'
import { CategoryExpenseSummary, GetExpenseSummaryResponse, PersonExpenseSummary } from '@/gen/wellspent/v1/budget_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

function personExpenseSummaryFromRest(dto: components['schemas']['PersonExpenseSummary']): PersonExpenseSummary {
  return new PersonExpenseSummary({
    budgetPersonId: BigInt(dto.budgetPersonId),
    plannedTotal: moneyFromRest(dto.plannedTotal),
    actualTotal: moneyFromRest(dto.actualTotal),
  })
}

function categoryExpenseSummaryFromRest(dto: components['schemas']['CategoryExpenseSummary']): CategoryExpenseSummary {
  return new CategoryExpenseSummary({
    categoryId: dto.categoryId,
    plannedTotal: moneyFromRest(dto.plannedTotal),
    actualTotal: dto.actualTotal ? moneyFromRest(dto.actualTotal) : undefined,
    isOver: dto.isOver,
    personBreakdowns: dto.personBreakdowns.map(personExpenseSummaryFromRest),
    notDuePlannedTotal: dto.notDuePlannedTotal ? moneyFromRest(dto.notDuePlannedTotal) : undefined,
    nextDueDate: dto.nextDueDate ? Timestamp.fromDate(new Date(`${dto.nextDueDate}T00:00:00Z`)) : undefined,
  })
}

/** Normalizes the C# backend's REST `GetExpenseSummaryResponse` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function expenseSummaryFromRest(dto: components['schemas']['GetExpenseSummaryResponse']): GetExpenseSummaryResponse {
  return new GetExpenseSummaryResponse({
    incomeFromSources: moneyFromRest(dto.incomeFromSources),
    incomeFromEntries: moneyFromRest(dto.incomeFromEntries),
    totalCommitted: moneyFromRest(dto.totalCommitted),
    totalPlanned: moneyFromRest(dto.totalPlanned),
    totalActual: moneyFromRest(dto.totalActual),
    uncategorizedActual: moneyFromRest(dto.uncategorizedActual),
    totalOverBudget: moneyFromRest(dto.totalOverBudget),
    totalUnplanned: moneyFromRest(dto.totalUnplanned),
    remainderPlan: moneyFromRest(dto.remainderPlan),
    remainderActual: moneyFromRest(dto.remainderActual),
    remainderPlanned: moneyFromRest(dto.remainderPlanned),
    planCategories: dto.planCategories.map(categoryExpenseSummaryFromRest),
    overviewCategories: dto.overviewCategories.map(categoryExpenseSummaryFromRest),
    fixedActualTotal: moneyFromRest(dto.fixedActualTotal),
    variableActualTotal: moneyFromRest(dto.variableActualTotal),
    overBudgetTransactionIds: dto.overBudgetTransactionIds,
  })
}
