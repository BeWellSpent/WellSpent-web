import type { Category, CategoryExpenseSummary, ExpenseAllocation, FixedExpense } from '@/gen/wellspent/v1/budget_pb'

export function parseMoney(units: bigint, nanos: number): number {
  return Number(units) + nanos / 1e9
}

export function moneyToProto(amount: number): { units: bigint; nanos: number } {
  const units = BigInt(Math.trunc(amount))
  const nanos = Math.round((amount - Number(units)) * 1e9)
  return { units, nanos }
}

function actualColor(actual: number, plannedTotal: number): string | undefined {
  if (plannedTotal <= 0) return undefined
  const ratio = actual / plannedTotal
  if (ratio > 1) return 'error.main'
  if (ratio >= 1) return 'success.main'
  if (ratio >= 0.9) return 'warning.main'
  return 'success.main'
}

// Savings rows use inverted thresholds: more saved = greener
function savingsActualColor(actual: number, plannedTotal: number): string | undefined {
  if (plannedTotal <= 0) return undefined
  const ratio = actual / plannedTotal
  if (ratio >= 0.9) return 'success.main'
  if (ratio >= 0.7) return '#eab308'
  if (ratio >= 0.5) return 'warning.main'
  return 'error.main'
}

export interface NotDueInfo {
  amount: number
  nextDue: Date | undefined
  fixedExpense: FixedExpense
}

/**
 * Per-category "upcoming bill" captions, read from the server's
 * `not_due_planned_total` / `next_due_date` rather than re-summed here.
 *
 * These amounts count toward nothing — not the category's planned total, not
 * `total_committed`, not the Overview's `total_planned`. A bill that isn't due
 * in this period isn't owed by it (issue #48). They exist only so a category
 * with a pending template doesn't vanish from the Plan tab between due
 * periods.
 *
 * The `FixedExpense` is still resolved locally, because the row's edit button
 * needs the mutable entity and a read-only summary can't supply one. It's an
 * entity reference, not a number, so it can't drift from the server's figures
 * the way a second local sum would.
 */
export function buildNotDueInfo(
  planCategories: CategoryExpenseSummary[],
  fixedExpenses: FixedExpense[],
): Map<number, NotDueInfo> {
  const byCat = new Map<number, NotDueInfo>()
  for (const pc of planCategories) {
    if (!pc.notDuePlannedTotal) continue
    const editTarget = earliestDueFixedExpense(fixedExpenses, pc.categoryId)
    if (!editTarget) continue
    byCat.set(pc.categoryId, {
      amount: parseMoney(pc.notDuePlannedTotal.units, pc.notDuePlannedTotal.nanos),
      nextDue: pc.nextDueDate ? new Date(Number(pc.nextDueDate.seconds) * 1000) : undefined,
      fixedExpense: editTarget,
    })
  }
  return byCat
}

/** The template the server's earliest `next_due_date` refers to, so tapping the row edits the bill the caption names. */
function earliestDueFixedExpense(fixedExpenses: FixedExpense[], categoryId: number): FixedExpense | undefined {
  return fixedExpenses
    .filter((fe) => fe.isActive && fe.categoryId === categoryId)
    .sort((a, b) => Number(a.nextDueDate?.seconds ?? 0n) - Number(b.nextDueDate?.seconds ?? 0n))[0]
}

export interface CategoryRowContext {
  people: { id: bigint }[]
  savingsCat: Category | undefined
  savingsTotal: number
  notDueFixedByCat: Map<number, NotDueInfo>
  catIdsWithAllocs: Set<number>
  fixedPlannedByCat: Map<number, number>
  allocMap: Map<string, ExpenseAllocation>
  txnActualByCat: Map<number, number>
}

export interface CategoryRowData {
  isSavings: boolean
  notDueInfo: NotDueInfo | undefined
  isNotDue: boolean
  isFixedOnly: boolean
  actual: number
  plannedTotal: number
  colorFn: (actual: number, plannedTotal: number) => string | undefined
  color: string | undefined
}

/**
 * What the row's total column shows: the planned amount, or — when nothing is
 * planned but a bill is coming — the upcoming amount, muted.
 *
 * Shared so the desktop table and the mobile card can't disagree about which
 * of the two numbers a category is showing, which matters more than usual
 * here: one of them counts toward the total underneath and the other counts
 * toward nothing.
 */
export function categoryTotalDisplay(row: CategoryRowData): { amount: number; muted: boolean } | undefined {
  if (row.plannedTotal > 0) return { amount: row.plannedTotal, muted: false }
  if (row.notDueInfo && row.notDueInfo.amount > 0) return { amount: row.notDueInfo.amount, muted: true }
  return undefined
}

// Shared derivation used by both the mobile card list and the desktop table
// so the two layouts can never drift on what counts as "not due", "fixed
// only", or which color a category's actual-vs-planned ratio renders as.
export function computeCategoryRow(cat: Category, ctx: CategoryRowContext): CategoryRowData {
  const isSavings = ctx.savingsCat?.id === cat.id
  const notDueInfo = isSavings ? undefined : ctx.notDueFixedByCat.get(cat.id)
  const isNotDue = !isSavings && !!notDueInfo
  const isFixedOnly = !isSavings && !ctx.catIdsWithAllocs.has(cat.id) && (ctx.fixedPlannedByCat.has(cat.id) || isNotDue)
  const actual = ctx.txnActualByCat.get(cat.id) ?? 0

  // A not-due template is deliberately absent from this chain — it is not a
  // planned amount for this period, only a caption (see buildNotDueInfo).
  // Mirrors the server's plannedTotal in expense_summary_calculator.go, so a
  // category with both an allocation and an upcoming bill reports the
  // allocation on both sides rather than whichever the client happened to
  // check first.
  let plannedTotal = 0
  if (isSavings) {
    plannedTotal = ctx.savingsTotal
  } else {
    for (const p of ctx.people) {
      const alloc = ctx.allocMap.get(`${cat.id}:${p.id}`)
      if (alloc) plannedTotal += parseMoney(alloc.plannedAmount?.units ?? 0n, alloc.plannedAmount?.nanos ?? 0)
    }
    if (plannedTotal === 0) plannedTotal = ctx.fixedPlannedByCat.get(cat.id) ?? 0
  }

  // No explicit not-due case: both color functions already return undefined
  // for a zero plan, which is exactly what a not-due-only row now has.
  const colorFn = isSavings ? savingsActualColor : actualColor
  const color = colorFn(actual, plannedTotal)

  return { isSavings, notDueInfo, isNotDue, isFixedOnly, actual, plannedTotal, colorFn, color }
}
