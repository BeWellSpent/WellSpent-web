/**
 * Which top-level section the budget view is showing, and — within Plan —
 * whether the planned or the actual figures are on screen.
 *
 * Both live in the URL rather than component state so a reload lands back
 * where you were, the same convention `?period=` and `?manage=` already use.
 *
 * Expense Plan and Expense Overview used to be two peer tabs here, which is
 * five bottom-bar items on a phone and one more than iOS had. Folding
 * Overview under Plan settles that at four on both clients (issue #60), and
 * matches how iOS had always nested them.
 */
export type ActiveView = 'plan' | 'transactions' | 'review' | 'reports'

/** Planned amounts, or what was actually spent against them. */
export type PlanKind = 'overview' | 'plan'

export const DEFAULT_VIEW: ActiveView = 'plan'
/** Overview first: what you spent is the more common question. */
export const DEFAULT_PLAN_KIND: PlanKind = 'overview'

const VIEWS: readonly ActiveView[] = ['plan', 'transactions', 'review', 'reports']
const PLAN_KINDS: readonly PlanKind[] = ['overview', 'plan']

/**
 * Reads `?view=` / `?planKind=`, translating the two legacy `view` values
 * that were peer tabs before Overview moved under Plan. Without this, a
 * bookmark or a shared link to `?view=overview` would silently land on the
 * default view instead of the one it names.
 */
export function parseViewParams(
  rawView: string | null,
  rawPlanKind: string | null,
): { view: ActiveView; planKind: PlanKind } {
  if (rawView === 'expenses') return { view: 'plan', planKind: 'plan' }
  if (rawView === 'overview') return { view: 'plan', planKind: 'overview' }

  const view = VIEWS.includes(rawView as ActiveView) ? (rawView as ActiveView) : DEFAULT_VIEW
  const planKind = PLAN_KINDS.includes(rawPlanKind as PlanKind)
    ? (rawPlanKind as PlanKind)
    : DEFAULT_PLAN_KIND
  return { view, planKind }
}
