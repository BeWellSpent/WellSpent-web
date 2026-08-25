import type { Transaction, PaymentMethod } from '@/gen/wellspent/v1/budget_pb'

export interface OwnerGroupedTransactions {
  /** Transactions belonging to each rendered person, keyed by budget person ID. */
  byPerson: Map<string, Transaction[]>
  /** Everything else — see `groupTransactionsByOwner`. */
  unclaimed: Transaction[]
}

/**
 * Resolves which budget person a transaction belongs to, or `null` when it
 * belongs to nobody.
 *
 * Attribution runs transaction -> payment method -> `budgetPersonId`, and this
 * **must** match the server's rule exactly (`computeActuals` in
 * `expense_summary_calculator.go`), which credits a person only when the
 * transaction has a payment method *and* that method names a person. Cash
 * spending, or a method attributed to nobody, belongs to no one.
 */
export function resolveOwnerId(tx: Transaction, methodMap: Map<string, PaymentMethod>): string | null {
  if (!tx.paymentMethodId) return null
  const method = methodMap.get(tx.paymentMethodId)
  if (!method?.budgetPersonId || method.budgetPersonId === 0n) return null
  return method.budgetPersonId.toString()
}

/**
 * Splits a category's transactions into per-person lists for the Expense
 * Overview drill-down, so each person's spending sits under their own row
 * rather than in one anonymous pile.
 *
 * `renderedPersonIds` is the set of people who actually get a row — i.e. the
 * response's `personBreakdowns`. Anything attributed to somebody outside that
 * set lands in `unclaimed` alongside the genuinely unattributed, which is what
 * keeps the invariant that **every transaction appears exactly once**. Two
 * different things fall in there:
 *
 * - spending with no payment method, or a method belonging to nobody (the
 *   common case — cash);
 * - spending by a person the server omitted from `personBreakdowns`, which it
 *   does when their planned *and* actual are both zero. A person whose
 *   transactions net to exactly zero has no row to sit under.
 *
 * Filing either under a person would be worse than a separate group: the
 * transactions listed beneath someone have to add up to the actual figure
 * printed beside their name, and neither of these counts toward it.
 *
 * Within a group, newest first — the same direction the Transactions tab's
 * variable feed runs. Day headers are deliberately not reproduced here; the
 * person is the grouping this view is about, and nesting person -> day ->
 * transaction gets tall fast on a phone.
 */
export function groupTransactionsByOwner(
  transactions: Transaction[],
  methodMap: Map<string, PaymentMethod>,
  renderedPersonIds: Set<string>,
): OwnerGroupedTransactions {
  const byPerson = new Map<string, Transaction[]>()
  const unclaimed: Transaction[] = []

  for (const tx of transactions) {
    const ownerId = resolveOwnerId(tx, methodMap)
    if (ownerId === null || !renderedPersonIds.has(ownerId)) {
      unclaimed.push(tx)
      continue
    }
    if (!byPerson.has(ownerId)) byPerson.set(ownerId, [])
    byPerson.get(ownerId)!.push(tx)
  }

  byPerson.forEach(sortNewestFirst)
  sortNewestFirst(unclaimed)
  return { byPerson, unclaimed }
}

// ID breaks the tie so two transactions on the same day keep a stable order
// between renders — dates here are day-granularity, so ties are common.
function sortNewestFirst(txs: Transaction[]): void {
  txs.sort(
    (a, b) =>
      Number(b.date?.seconds ?? 0n) - Number(a.date?.seconds ?? 0n) || a.id.localeCompare(b.id),
  )
}
