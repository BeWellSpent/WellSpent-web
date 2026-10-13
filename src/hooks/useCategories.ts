'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Category } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { categoryFromRest } from '@/lib/budget/categoryTransport'
import { isEnabled } from '@/lib/config/features'

/**
 * The one cache key for `listCategories` — previously two different ones
 * (`['categories']` and `['categories', budgetProfileId]`) for the same RPC
 * across 9 call sites, the exact bug `usePaymentMethods`'s own doc comment
 * describes already having happened once for payment methods. `budgetProfileId`
 * is part of the key because the response genuinely differs by it — passing
 * one also returns categories referenced by that budget's own
 * transactions/fixed expenses, so a collaborator can see categories the
 * owner created (see openapi's `listCategories` description).
 */
export function categoriesQueryKey(budgetProfileId?: string) {
  return ['categories', budgetProfileId ?? null] as const
}

export function useCategories(budgetProfileId?: string): { categories: Category[]; isLoading: boolean } {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: categoriesQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/categories', { params: { query: { budgetProfileId } } }))
        return { categories: res.categories.map(categoryFromRest) }
      }
      return client.listCategories({ budgetProfileId })
    },
  })

  return { categories: data?.categories ?? [], isLoading }
}
