import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'

/**
 * The most recent non-archived period, falling back to the newest period
 * overall if every period happens to be archived (shouldn't normally happen
 * given the daily cycle-budgets job, but keeps this defined even so).
 */
export function resolveActivePeriod(periods: BudgetPeriod[]): BudgetPeriod | undefined {
  return [...periods]
    .filter((p) => !p.isArchived)
    .sort((a, b) => Number(b.startDate?.seconds ?? 0n) - Number(a.startDate?.seconds ?? 0n))[0]
    ?? periods[0]
}

/**
 * Resolves which period a budget view should display: the explicit
 * `overrideId` (e.g. from a `?period=` URL param, used when viewing a past
 * period from the budget list) if it matches one of `periods`, otherwise the
 * active period. Falls back to the active period if `overrideId` doesn't
 * match anything (e.g. a stale/invalid link) rather than showing nothing.
 */
export function resolvePeriod(periods: BudgetPeriod[], overrideId: string | null | undefined): BudgetPeriod | undefined {
  if (!overrideId) return resolveActivePeriod(periods)
  return periods.find((p) => p.id === overrideId) ?? resolveActivePeriod(periods)
}
