'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { IncomeSource } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { incomeSourceFromRest } from '@/lib/budget/incomeTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's income sources — previously inlined identically in IncomePanel and PeoplePanel. */
export function incomeSourcesQueryKey(budgetProfileId: string) {
  return ['income-sources', budgetProfileId] as const
}

export function useIncomeSources(budgetProfileId: string): { sources: IncomeSource[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: incomeSourcesQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/income-sources', { params: { path: { id: budgetProfileId } } }))
        return { sources: res.sources.map(incomeSourceFromRest) }
      }
      return client.listIncomeSources({ budgetProfileId })
    },
  })

  return { sources: data?.sources ?? [], isLoading }
}
