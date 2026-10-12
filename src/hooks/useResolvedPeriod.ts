'use client'

import { useBudgetPeriods } from '@/hooks/useBudgetPeriods'
import { resolvePeriod } from '@/hooks/resolvePeriod'

/**
 * Resolves "which period" for a budget profile — the active period by
 * default, or a specific `overridePeriodId` when the caller wants a past
 * period (e.g. `BudgetView` reading `?period=` when navigating in from the
 * budget list). The override is an explicit param, not read from the URL
 * internally, because different callers need different behavior on the same
 * route: `BudgetView` should follow `?period=` (it's showing whichever
 * period the user browsed to), but `BudgetSidebar`'s Manage panels
 * (Income/Savings/Payment Methods/etc.) should always use the true active
 * period regardless of which period is being browsed in the main content —
 * managing your recurring sources is a "now" action, not scoped to
 * whichever period you happen to be looking at. Shared between the two
 * components, which previously each computed the active period
 * independently with duplicated filter/sort logic.
 */
export function useResolvedPeriod(budgetProfileId: string, overridePeriodId?: string | null, enabled = true) {
  const { periods, isLoading } = useBudgetPeriods(budgetProfileId, enabled)
  const period = resolvePeriod(periods, overridePeriodId)

  return {
    periods,
    period,
    isArchived: period?.isArchived ?? false,
    isLoading,
  }
}
