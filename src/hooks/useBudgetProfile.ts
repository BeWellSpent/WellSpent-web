'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { budgetProfileFromRest } from '@/lib/budget/budgetTransport'
import { isEnabled } from '@/lib/config/features'

/**
 * The one cache key for a single budget profile.
 *
 * Previously inlined identically in five places (`BudgetSidebar`, `BudgetView`,
 * `PeriodListPanel`, `useBudgetRole`, `BudgetSettingToggle`) — extracted while
 * flipping this RPC to REST, so there's one place to flip instead of five.
 */
export function budgetProfileQueryKey(budgetProfileId: string) {
  return ['budget-profile', budgetProfileId] as const
}

export function useBudgetProfile(budgetProfileId: string): {
  profile: BudgetProfile | undefined
  isLoading: boolean
  error: unknown
} {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading, error } = useQuery({
    queryKey: budgetProfileQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}', { params: { path: { id: budgetProfileId } } }))
        return { profile: budgetProfileFromRest(res.profile) }
      }
      return client.getBudgetProfile({ id: budgetProfileId })
    },
  })

  return { profile: data?.profile, isLoading, error }
}
