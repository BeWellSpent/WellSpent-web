'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { SavingsSource } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { savingsSourceFromRest } from '@/lib/budget/savingsTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's savings sources — previously inlined identically in SavingsPanel and ExpensesPanel. */
export function savingsSourcesQueryKey(budgetProfileId: string) {
  return ['savings-sources', budgetProfileId] as const
}

export function useSavingsSources(budgetProfileId: string): { sources: SavingsSource[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: savingsSourcesQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/savings-sources', { params: { path: { id: budgetProfileId } } }))
        return { sources: res.sources.map(savingsSourceFromRest) }
      }
      return client.listSavingsSources({ budgetProfileId })
    },
  })

  return { sources: data?.sources ?? [], isLoading }
}
