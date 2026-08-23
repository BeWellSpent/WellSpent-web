import type { Transaction, Category, PaymentMethod, BudgetPerson, FixedExpense, TransactionReview } from '@/gen/wellspent/v1/budget_pb'
import { formatMoneyFromNumber } from '@/lib/format'

/** Resolves a category to the name shown on screen — translated for system
 *  categories, verbatim for user-created ones. See useCategoryName. */
export type CategoryNameResolver = (cat: Category | undefined) => string

export type SortKey = 'name' | 'day' | 'amount' | 'category' | 'paymentMethod' | 'owner'
export type FilterOption = 'none' | 'spentOnly' | 'exceededOnly' | 'excludedOnly'

export interface TransactionDayGroup {
  day: number
  label: string
  transactions: Transaction[]
}

export function formatVariableAmount(amount: number, currency: string, locale: string): { text: string; color: string | undefined } {
  if (amount < 0) return { text: `+${formatMoneyFromNumber(-amount, currency, locale)}`, color: 'success.main' }
  if (amount > 0) return { text: `-${formatMoneyFromNumber(amount, currency, locale)}`, color: 'error.main' }
  return { text: formatMoneyFromNumber(0, currency, locale), color: undefined }
}

export function formatDate(ts: { seconds: bigint } | undefined): string {
  if (!ts || ts.seconds === 0n) return ''
  return new Date(Number(ts.seconds) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function txAmount(t: Transaction): number {
  return Number(t.amount?.units ?? 0n) + (t.amount?.nanos ?? 0) / 1e9
}

// Maps a variable transaction's ID to the name of the fixed-type transaction
// it's pending review against. Only pending reviews are included — a
// confirmed review's transaction is excluded from totals (is_excluded, same
// as Income) but still visible as a normal row, so it no longer needs the
// "pending" badge; a dismissed review is no longer an active link either.
export function buildPendingReviewMatchMap(reviews: TransactionReview[]): Map<string, string> {
  return new Map(
    reviews
      .filter((r) => r.status === 'pending')
      .map((r) => [r.transactionId, r.matchedTransactionName]),
  )
}

export type SwipeDirection = 'left' | 'right' | null

// Determines whether a touch gesture was an intentional horizontal swipe, as
// opposed to a vertical scroll with incidental sideways drift (very easy to
// trigger on a tall list without this check). Horizontal movement must clear
// the threshold and dominate vertical movement by at least 2x.
export function resolveSwipeDirection(deltaX: number, deltaY: number, threshold = 60): SwipeDirection {
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 2) return null
  return deltaX > 0 ? 'right' : 'left'
}

// A transaction is left out of totals if manually flagged, or if it's the
// Income category — payroll deposits (auto-tagged by Plaid) and any manually
// categorized income should never count toward the spending total.
export function isTransactionExcluded(t: Transaction, incomeCategoryId?: number): boolean {
  return t.isExcluded || (incomeCategoryId != null && t.categoryId === incomeCategoryId)
}

export function txPlannedAmount(t: Transaction): number {
  return Number(t.plannedAmount?.units ?? 0n) + (t.plannedAmount?.nanos ?? 0) / 1e9
}

export function fixedExpensePlannedAmount(fe: FixedExpense): number {
  return Number(fe.plannedAmount?.units ?? 0n) + (fe.plannedAmount?.nanos ?? 0) / 1e9
}

/**
 * "N/M" payment-plan progress for a fixed expense, or null when it has no plan.
 *
 * `paymentsMade` is computed by the server (`FixedExpensePaymentsMade`). It
 * used to be derived here from the anchor date and interval, and separately
 * again inside EditFixedExpenseModal — the two disagreed with each other, and
 * both disagreed with iOS. None of them could be right: the schedule falls
 * back to `fixed_expense.created_at` when `anchorDate` is unset, and that
 * column is deliberately not on the wire. See docs/features/expense-summary.md.
 */
export function paymentProgress(fe: FixedExpense): string | null {
  if (!fe.totalPayments || fe.totalPayments <= 0) return null
  return `${fe.paymentsMade}/${fe.totalPayments}`
}

export function nextDueDateLabel(fe: FixedExpense): string {
  if (!fe.nextDueDate || fe.nextDueDate.seconds === 0n) return ''
  return new Date(Number(fe.nextDueDate.seconds) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function resolveDay(t: Transaction): number {
  return Number(t.date?.seconds ?? 0n)
}

function formatDayHeader(ts: { seconds: bigint } | undefined): string {
  if (!ts || ts.seconds === 0n) return ''
  return new Date(Number(ts.seconds) * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// `categoryName` is passed in rather than reading `.name` directly: a system
// category's displayed name is translated, and search has to match what the
// user can actually see on screen while sort has to order by it. Required, not
// optional-with-a-fallback — an optional translator that silently defaults to
// English is the same silent failure this change exists to remove.
export function resolveCategoryName(
  categoryId: number,
  categoryMap: Map<number, Category>,
  categoryName: CategoryNameResolver,
): string {
  return categoryId ? categoryName(categoryMap.get(categoryId)) : ''
}

export function resolveMethodName(paymentMethodId: string, methodMap: Map<string, PaymentMethod>): string {
  if (!paymentMethodId) return ''
  const m = methodMap.get(paymentMethodId)
  return m ? (m.alias || m.name) : ''
}

export function resolveOwnerName(
  paymentMethodId: string,
  methodMap: Map<string, PaymentMethod>,
  personMap: Map<string, BudgetPerson>,
): string {
  const method = paymentMethodId ? methodMap.get(paymentMethodId) : undefined
  const person = method?.budgetPersonId && method.budgetPersonId !== 0n
    ? personMap.get(method.budgetPersonId.toString())
    : undefined
  return person?.userName ?? ''
}

export function matchesSearch(
  name: string,
  categoryId: number,
  paymentMethodId: string,
  query: string,
  categoryMap: Map<number, Category>,
  categoryName: CategoryNameResolver,
  methodMap: Map<string, PaymentMethod>,
  personMap: Map<string, BudgetPerson>,
): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    name.toLowerCase().includes(q) ||
    resolveCategoryName(categoryId, categoryMap, categoryName).toLowerCase().includes(q) ||
    resolveOwnerName(paymentMethodId, methodMap, personMap).toLowerCase().includes(q)
  )
}

export function compareTransactions(
  a: Transaction,
  b: Transaction,
  key: SortKey,
  dir: 'asc' | 'desc',
  categoryMap: Map<number, Category>,
  categoryName: CategoryNameResolver,
  methodMap: Map<string, PaymentMethod>,
  personMap: Map<string, BudgetPerson>,
): number {
  const sign = dir === 'asc' ? 1 : -1
  let primary: number
  switch (key) {
    case 'name': primary = a.name.localeCompare(b.name) * sign; break
    case 'day': primary = (resolveDay(a) - resolveDay(b)) * sign; break
    case 'amount': primary = (txPlannedAmount(a) - txPlannedAmount(b)) * sign; break
    case 'category':
      primary = resolveCategoryName(a.categoryId, categoryMap, categoryName).localeCompare(resolveCategoryName(b.categoryId, categoryMap, categoryName)) * sign
      break
    case 'paymentMethod':
      primary = resolveMethodName(a.paymentMethodId, methodMap).localeCompare(resolveMethodName(b.paymentMethodId, methodMap)) * sign
      break
    case 'owner':
      primary = resolveOwnerName(a.paymentMethodId, methodMap, personMap).localeCompare(resolveOwnerName(b.paymentMethodId, methodMap, personMap)) * sign
      break
  }
  return primary !== 0 ? primary : a.id.localeCompare(b.id)
}

/**
 * Active fixed expenses with no transaction in this period — i.e. upcoming
 * bills, shown in the Fixed tab's "Future" section so a template is never
 * simply invisible until its due date arrives.
 *
 * "No transaction this period" is a sound proxy for "not due this period":
 * `createNextPeriod` spawns a transaction at period start for everything due
 * within it, so a template with nothing here is genuinely next due in a later
 * period. A template created mid-period spawns immediately when it's already
 * due, and a deactivated one drops out via `isActive` while its existing
 * transaction stays.
 *
 * That reasoning only holds for the *live* period. `ListFixedExpenses` is
 * scoped to the profile, not the period, so on an archived period this would
 * list every template created since — reporting bills as "upcoming" in a month
 * that already ended. Nothing is upcoming in a closed period, so the whole
 * section is suppressed there rather than shown with a wrong list.
 */
export function notDueFixedExpenses(
  expenses: FixedExpense[],
  fixedTransactions: Transaction[],
  isArchivedPeriod = false,
): FixedExpense[] {
  if (isArchivedPeriod) return []
  return expenses
    .filter((fe) => fe.isActive && !fixedTransactions.some((tx) => tx.fixedExpenseId === fe.id))
    // Soonest first. These arrive in ListFixedExpenses' `ORDER BY name`,
    // which is arbitrary for a list whose whole purpose is "what's coming up
    // next" (issue #48). A template with no next due date sorts last rather
    // than jumping to the front as a zero timestamp would.
    .sort((a, b) => nextDueSortKey(a) - nextDueSortKey(b))
}

function nextDueSortKey(fe: FixedExpense): number {
  return fe.nextDueDate ? Number(fe.nextDueDate.seconds) : Number.MAX_SAFE_INTEGER
}

export function splitByPaidStatus(transactions: Transaction[]): { unpaid: Transaction[]; paid: Transaction[] } {
  const unpaid: Transaction[] = []
  const paid: Transaction[] = []
  transactions.forEach((tx) => (tx.isPaid ? paid : unpaid).push(tx))
  return { unpaid, paid }
}

export function groupTransactionsByDay(
  transactions: Transaction[],
  sortKey: SortKey,
  sortDir: 'asc' | 'desc',
  categoryMap: Map<number, Category>,
  categoryName: CategoryNameResolver,
  methodMap: Map<string, PaymentMethod>,
  personMap: Map<string, BudgetPerson>,
): TransactionDayGroup[] {
  const groups = new Map<number, Transaction[]>()
  transactions.forEach((tx) => {
    const key = resolveDay(tx)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  })
  const dirSign = sortDir === 'asc' ? 1 : -1
  const days = [...groups.keys()].sort((a, b) => (a - b) * dirSign)
  return days.map((day) => {
    const dayTransactions = [...groups.get(day)!].sort((a, b) =>
      compareTransactions(a, b, sortKey, sortDir, categoryMap, categoryName, methodMap, personMap))
    return { day, label: formatDayHeader(dayTransactions[0]?.date), transactions: dayTransactions }
  })
}

/**
 * Whether adding a transaction has to be blocked because the budget has no
 * payment method yet.
 *
 * A payment method is the one prerequisite the user has to create themselves —
 * system categories always exist and the owner is auto-added as a person — so
 * with none, the add form can be filled in completely and still refuse to save.
 * Blocking the entry point with an explanation beats a permanently disabled
 * Save button.
 *
 * Returns false while the list is still loading: a gate shown on incomplete
 * data reads as a bug to someone who does have payment methods.
 */
export function needsPaymentMethodSetup(methods: PaymentMethod[], isLoading: boolean): boolean {
  if (isLoading) return false
  return methods.length === 0
}
