import { buildNotDueInfo, computeCategoryRow, type CategoryRowContext } from '../helpers'
import type { Category, CategoryExpenseSummary, ExpenseAllocation, FixedExpense } from '@/gen/wellspent/v1/budget_pb'

function money(units: bigint): { units: bigint; nanos: number } {
  return { units, nanos: 0 }
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: 1, name: 'Rent', isSystem: false, ...overrides } as Category
}

function makeFixedExpense(overrides: Partial<FixedExpense> = {}): FixedExpense {
  return {
    id: 'fe-1',
    name: 'Rent',
    categoryId: 1,
    isActive: true,
    plannedAmount: money(0n),
    ...overrides,
  } as FixedExpense
}

function makeAllocation(units: bigint): ExpenseAllocation {
  return { categoryId: 1, budgetPersonId: 1n, plannedAmount: money(units) } as ExpenseAllocation
}

function makePlanCategory(overrides: Partial<CategoryExpenseSummary> = {}): CategoryExpenseSummary {
  return { categoryId: 1, plannedTotal: money(0n), ...overrides } as CategoryExpenseSummary
}

function makeContext(overrides: Partial<CategoryRowContext> = {}): CategoryRowContext {
  return {
    people: [{ id: 1n }],
    savingsCat: undefined,
    savingsTotal: 0,
    notDueFixedByCat: new Map(),
    catIdsWithAllocs: new Set(),
    fixedPlannedByCat: new Map(),
    allocMap: new Map(),
    txnActualByCat: new Map(),
    ...overrides,
  }
}

describe('buildNotDueInfo', () => {
  it('takes the amount and date from the server, not from the templates', () => {
    // The server already decided this amount counts toward nothing; re-summing
    // the templates here would be a second implementation of a figure the user
    // reads next to the first (issue #48).
    const planCategories = [makePlanCategory({
      notDuePlannedTotal: money(25n),
      nextDueDate: { seconds: 100n, nanos: 0 },
    })]
    const fixedExpenses = [makeFixedExpense({ plannedAmount: money(999n) })]

    const info = buildNotDueInfo(planCategories, fixedExpenses)

    expect(info.get(1)?.amount).toBe(25)
    expect(info.get(1)?.nextDue).toEqual(new Date(100_000))
  })

  it('ignores categories with nothing upcoming', () => {
    const planCategories = [makePlanCategory({ plannedTotal: money(400n) })]

    expect(buildNotDueInfo(planCategories, [makeFixedExpense()]).size).toBe(0)
  })

  it('attaches the template the earliest due date refers to, so the edit button opens the bill named in the caption', () => {
    const planCategories = [makePlanCategory({
      notDuePlannedTotal: money(30n),
      nextDueDate: { seconds: 100n, nanos: 0 },
    })]
    const later = makeFixedExpense({ id: 'fe-later', nextDueDate: { seconds: 900n, nanos: 0 } })
    const soonest = makeFixedExpense({ id: 'fe-soonest', nextDueDate: { seconds: 100n, nanos: 0 } })

    const info = buildNotDueInfo(planCategories, [later, soonest])

    expect(info.get(1)?.fixedExpense.id).toBe('fe-soonest')
  })

  it('skips a category whose only matching template is deactivated', () => {
    // Nothing editable to point the row at, so the caption would be a dead end.
    const planCategories = [makePlanCategory({ notDuePlannedTotal: money(30n) })]

    expect(buildNotDueInfo(planCategories, [makeFixedExpense({ isActive: false })]).size).toBe(0)
  })
})

describe('computeCategoryRow', () => {
  it('reports zero planned for a category whose only bill is not due yet', () => {
    // The row still renders — that is what notDueInfo is for — but a bill that
    // has not arrived is not money this period has committed (issue #48).
    const ctx = makeContext({
      notDueFixedByCat: new Map([[1, { amount: 120, nextDue: undefined, fixedExpense: makeFixedExpense() }]]),
    })

    const row = computeCategoryRow(makeCategory(), ctx)

    expect(row.isNotDue).toBe(true)
    expect(row.plannedTotal).toBe(0)
  })

  it('prefers an allocation over an upcoming bill, matching the server', () => {
    // Previously the not-due branch ran first and overwrote a real allocation
    // with the template amount, disagreeing with the server's own tier order.
    const ctx = makeContext({
      catIdsWithAllocs: new Set([1]),
      allocMap: new Map([['1:1', makeAllocation(400n)]]),
      notDueFixedByCat: new Map([[1, { amount: 120, nextDue: undefined, fixedExpense: makeFixedExpense() }]]),
    })

    expect(computeCategoryRow(makeCategory(), ctx).plannedTotal).toBe(400)
  })

  it('leaves a not-due row uncoloured, since there is no plan to compare against', () => {
    const ctx = makeContext({
      txnActualByCat: new Map([[1, 50]]),
      notDueFixedByCat: new Map([[1, { amount: 120, nextDue: undefined, fixedExpense: makeFixedExpense() }]]),
    })

    expect(computeCategoryRow(makeCategory(), ctx).color).toBeUndefined()
  })

  it('still falls back to a fixed transaction due this period', () => {
    const ctx = makeContext({ fixedPlannedByCat: new Map([[1, 300]]) })

    expect(computeCategoryRow(makeCategory(), ctx).plannedTotal).toBe(300)
  })

  it('uses the savings total for the Savings category', () => {
    const savingsCat = makeCategory({ id: 9, name: 'Savings', isSystem: true })
    const ctx = makeContext({ savingsCat, savingsTotal: 250 })

    const row = computeCategoryRow(savingsCat, ctx)

    expect(row.isSavings).toBe(true)
    expect(row.plannedTotal).toBe(250)
  })
})
