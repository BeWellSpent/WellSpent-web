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
 * (issue #52). Before this, web dropped the number entirely (`—`) and iOS
 * printed a bare `-$X`, so the sign read as inverted between the two tabs.
 *
 * Deliberately NOT used for the remainder rows: a negative "remaining" means
 * spending past income, not money received, and a `+` prefix there would say
 * the opposite of what it means.
 */
export function formatOverviewAmountText(amount: number, formatMoney: (n: number) => string): string {
  if (amount < 0) return `+${formatMoney(-amount)}`
  if (amount === 0) return '—'
  return formatMoney(amount)
}

/**
 * An actual-spend cell: its text plus the colour that goes with it.
 *
 * Shared by the desktop table row and the mobile card so the two layouts
 * can't disagree about whether a category is over budget or has received
 * money. Note green carries both meanings here — under budget, and money in —
 * disambiguated by the `+` prefix, exactly as it is in the transactions list.
 */
export function formatOverviewActual(
  actual: number,
  isOver: boolean,
  formatMoney: (n: number) => string,
): { text: string; color: string } {
  if (actual < 0) return { text: formatOverviewAmountText(actual, formatMoney), color: 'success.main' }
  if (actual === 0) return { text: '—', color: 'text.disabled' }
  return { text: formatMoney(actual), color: isOver ? 'error.main' : 'success.main' }
}
