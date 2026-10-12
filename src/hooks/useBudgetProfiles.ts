'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { budgetProfileFromRest } from '@/lib/budget/budgetTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for the caller's budget list — previously inlined identically in `BudgetHome` and `PlaidSection`. */
export function budgetProfilesQueryKey() {
  return ['budgets', 'list'] as const
}

/** Budgets the caller owns or is an active member of. Returns the full query result since `BudgetHome` retries on error. */
export function useBudgetProfiles(): UseQueryResult<{ profiles: BudgetProfile[] }> {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  return useQuery({
    queryKey: budgetProfilesQueryKey(),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets'))
        return { profiles: res.profiles.map(budgetProfileFromRest) }
      }
      return client.listBudgetProfiles({})
    },
  })
}
