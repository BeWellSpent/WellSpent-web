'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { budgetPeriodFromRest } from '@/lib/budget/budgetTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's periods — previously inlined identically in `PeriodListPanel` and `useResolvedPeriod`. */
export function budgetPeriodsQueryKey(budgetProfileId: string) {
  return ['budget-periods', budgetProfileId] as const
}

export function useBudgetPeriods(budgetProfileId: string, enabled = true): { periods: BudgetPeriod[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: budgetPeriodsQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/periods', { params: { path: { id: budgetProfileId } } }))
        return { periods: res.periods.map(budgetPeriodFromRest) }
      }
      return client.listBudgetPeriods({ budgetProfileId })
    },
    enabled,
  })

  return { periods: data?.periods ?? [], isLoading }
}
