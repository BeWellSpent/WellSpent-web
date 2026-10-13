'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { ExpenseAllocation } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { expenseAllocationFromRest } from '@/lib/budget/expenseAllocationTransport'
import { isEnabled } from '@/lib/config/features'

export function expenseAllocationsQueryKey(budgetProfileId: string) {
  return ['expense-allocations', budgetProfileId] as const
}

export function useExpenseAllocations(budgetProfileId: string): { allocations: ExpenseAllocation[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: expenseAllocationsQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/expense-allocations', { params: { path: { id: budgetProfileId } } }))
        return { allocations: res.allocations.map(expenseAllocationFromRest) }
      }
      return client.listExpenseAllocations({ budgetProfileId })
    },
  })

  return { allocations: data?.allocations ?? [], isLoading }
}
