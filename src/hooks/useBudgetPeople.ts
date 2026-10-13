'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { budgetPersonFromRest } from '@/lib/budget/budgetTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's people — previously inlined identically in 14 places. */
export function budgetPeopleQueryKey(budgetProfileId: string) {
  return ['budget-people', budgetProfileId] as const
}

export function useBudgetPeople(budgetProfileId: string): { people: BudgetPerson[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: budgetPeopleQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/people', { params: { path: { id: budgetProfileId } } }))
        return { people: res.people.map(budgetPersonFromRest) }
      }
      return client.listBudgetPeople({ budgetProfileId })
    },
  })

  return { people: data?.people ?? [], isLoading }
}
