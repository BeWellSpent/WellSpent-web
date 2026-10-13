import { expenseSummaryFromRest } from '../expenseSummaryTransport'

const money = { units: 100, nanos: 0, currency: 'USD' }

describe('expenseSummaryFromRest', () => {
  it('normalizes the top-level Money totals and the nested category/person breakdowns', () => {
    const summary = expenseSummaryFromRest({
      incomeFromSources: money, incomeFromEntries: money, totalCommitted: money, totalPlanned: money,
      totalActual: money, uncategorizedActual: money, totalOverBudget: money, totalUnplanned: money,
      remainderPlan: money, remainderActual: money, remainderPlanned: money,
      planCategories: [{
        categoryId: 1, plannedTotal: money, isOver: false,
        personBreakdowns: [{ budgetPersonId: 1, plannedTotal: money, actualTotal: money }],
        notDuePlannedTotal: money, nextDueDate: '2026-11-01',
      }],
      overviewCategories: [{
        categoryId: 1, plannedTotal: money, actualTotal: money, isOver: true, personBreakdowns: [],
      }],
      fixedActualTotal: money, variableActualTotal: money, overBudgetTransactionIds: ['t1', 't2'],
    })
    expect(summary.totalCommitted?.units).toBe(100n)
    expect(summary.planCategories[0].personBreakdowns[0].budgetPersonId).toBe(1n)
    expect(summary.planCategories[0].nextDueDate?.toDate().toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(summary.overviewCategories[0].isOver).toBe(true)
    expect(summary.overBudgetTransactionIds).toEqual(['t1', 't2'])
  })

  it('leaves actualTotal/notDuePlannedTotal/nextDueDate unset when absent, matching a plan-only category row', () => {
    const summary = expenseSummaryFromRest({
      incomeFromSources: money, incomeFromEntries: money, totalCommitted: money, totalPlanned: money,
      totalActual: money, uncategorizedActual: money, totalOverBudget: money, totalUnplanned: money,
      remainderPlan: money, remainderActual: money, remainderPlanned: money,
      planCategories: [{ categoryId: 2, plannedTotal: money, isOver: false, personBreakdowns: [] }],
      overviewCategories: [],
      fixedActualTotal: money, variableActualTotal: money, overBudgetTransactionIds: [],
    })
    expect(summary.planCategories[0].actualTotal).toBeUndefined()
    expect(summary.planCategories[0].notDuePlannedTotal).toBeUndefined()
    expect(summary.planCategories[0].nextDueDate).toBeUndefined()
  })
})
