/**
 * Amount display for the Expense Overview tab.
 *
 * The Overview is an actual-vs-planned report, so spending reads as a
 * positive magnitude here — deliberately unlike the Transactions ledger,
 * where the same spend reads `-$X` red. Its planned column, its `% of total`
 * chips and its chart are all magnitudes, and negating only the actual column
 * would print `-$100 of $150 planned`.
 *
 * What the two tabs *must* agree on is money **in**. A category whose
 * transactions net negative is money received, and it renders `+$X` green on
 * both tabs — matching `formatVariableAmount` in transactionsPanel/helpers.ts
 * (issue #52).
 *
 * Deliberately NOT used for the remainder rows: a negative "remaining" means
 * spending past income, not money received, and a `+` prefix there would say
 * the opposite of what it means.
 */
export function formatOverviewAmountText(amount: number, formatMoney: (n: number) => string): string {
  if (amount < 0) return `+${formatMoney(-amount)}`
  return formatMoney(amount)
}

/**
 * The colour an actual-spend amount carries. Three states for spending, so
 * green means exactly one thing — "inside a plan you set":
 *
 * - received (negative): green, money in
 * - over its plan:       red
 * - inside its plan:     green
 * - no plan at all:      neutral, NOT green
 * - exactly zero:        muted
 *
 * That fourth case is the one worth stating. `is_over` is
 * `planned > 0 && actual > planned` server-side, so an unplanned category can
 * never be "over" — it used to fall through to green and read as within
 * budget, while the same money was simultaneously counted into the orange
 * Unplanned total at the bottom of this very screen. Unplanned spending is
 * not a success.
 *
 * Mirrored by `OverviewAmountFormatting.tone` on iOS. The two return
 * different things — an MUI token here, an abstract tone there, because a
 * pure Swift helper shouldn't import SwiftUI — but the branch order is the
 * contract and must stay identical.
 */
export function overviewActualColor(actual: number, planned: number, isOver: boolean): string {
  if (actual < 0) return 'success.main'
  if (actual === 0) return 'text.disabled'
  if (isOver) return 'error.main'
  if (planned > 0) return 'success.main'
  return 'text.secondary'
}

/**
 * An actual-spend cell: its text plus the colour that goes with it. Shared by
 * the desktop table row and the mobile card so the two layouts can't disagree
 * about whether a category is over budget, unplanned, or has received money.
 */
export function formatOverviewActual(
  actual: number,
  planned: number,
  isOver: boolean,
  formatMoney: (n: number) => string,
): { text: string; color: string } {
  return {
    text: formatOverviewAmountText(actual, formatMoney),
    color: overviewActualColor(actual, planned, isOver),
  }
}
