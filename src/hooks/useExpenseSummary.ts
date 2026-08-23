'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { GetExpenseSummaryResponse } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'

/**
 * The one cache key for a period's expense summary.
 *
 * `GetExpenseSummary` is the home of every planned/actual figure the UI shows
 * (see docs/features/expense-summary.md). Three panels now read it — the
 * Expense Plan and Overview tabs plus the Transactions tab — and the key was
 * being retyped inline in each. Import this rather than writing it out again;
 * two spellings of one key is what left payment methods invalidating half
 * their readers.
 */
export function expenseSummaryQueryKey(budgetPeriodId: string | undefined) {
  return ['expense-summary', budgetPeriodId] as const
}

export function useExpenseSummary(budgetPeriodId: string | undefined): {
  summary: GetExpenseSummaryResponse | undefined
  isLoading: boolean
} {
  const client = useClient(BudgetService)

  const { data, isLoading } = useQuery({
    queryKey: expenseSummaryQueryKey(budgetPeriodId),
    queryFn: () => client.getExpenseSummary({ budgetPeriodId: budgetPeriodId! }),
    enabled: !!budgetPeriodId,
  })

  return { summary: data, isLoading }
}
