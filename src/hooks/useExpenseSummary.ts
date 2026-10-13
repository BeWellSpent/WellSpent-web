'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { GetExpenseSummaryResponse } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { useFocusedView } from '@/hooks/useFocusedView'
import { unwrap } from '@/lib/api/rest'
import { expenseSummaryFromRest } from '@/lib/budget/expenseSummaryTransport'
import { isEnabled } from '@/lib/config/features'

/**
 * The one cache key for a period's expense summary.
 *
 * `GetExpenseSummary` is the home of every planned/actual figure the UI shows
 * (see docs/features/expense-summary.md). Three panels now read it — the
 * Expense Plan and Overview tabs plus the Transactions tab — and the key was
 * being retyped inline in each. Import this rather than writing it out again;
 * two spellings of one key is what left payment methods invalidating half
 * their readers.
 *
 * Deliberately a 2-element prefix (no focusedView) — invalidateQueries
 * matches by prefix, so a mutation invalidates both view scopes at once.
 */
export function expenseSummaryQueryKey(budgetPeriodId: string | undefined) {
  return ['expense-summary', budgetPeriodId] as const
}

export function useExpenseSummary(budgetPeriodId: string | undefined, budgetProfileId: string): {
  summary: GetExpenseSummaryResponse | undefined
  isLoading: boolean
} {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()
  const focusedView = useFocusedView(budgetProfileId)

  const { data, isLoading } = useQuery({
    queryKey: [...expenseSummaryQueryKey(budgetPeriodId), focusedView],
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budget-periods/{id}/expense-summary', {
          params: { path: { id: budgetPeriodId! }, query: { focusedView } },
        }))
        return expenseSummaryFromRest(res)
      }
      return client.getExpenseSummary({ budgetPeriodId: budgetPeriodId!, focusedView })
    },
    enabled: !!budgetPeriodId,
  })

  return { summary: data, isLoading }
}
