'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { fixedExpenseFromRest } from '@/lib/budget/fixedExpenseTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's fixed-expense templates — previously inlined identically in TransactionsPanel and ExpensesPanel. */
export function fixedExpensesQueryKey(budgetProfileId: string) {
  return ['fixed-expenses', budgetProfileId] as const
}

export function useFixedExpenses(budgetProfileId: string): { fixedExpenses: FixedExpense[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: fixedExpensesQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/fixed-expenses', { params: { path: { id: budgetProfileId } } }))
        return { fixedExpenses: res.fixedExpenses.map(fixedExpenseFromRest) }
      }
      const res = await client.listFixedExpenses({ budgetProfileId })
      return { fixedExpenses: res.expenses }
    },
  })

  return { fixedExpenses: data?.fixedExpenses ?? [], isLoading }
}
