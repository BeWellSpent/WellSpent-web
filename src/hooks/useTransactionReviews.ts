'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { TransactionReview } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { transactionReviewFromRest } from '@/lib/budget/transactionReviewTransport'
import { isEnabled } from '@/lib/config/features'

/** The one cache key for a budget's transaction reviews — previously inlined identically in BudgetView, TransactionsPanel, and TransactionReviewPanel. */
export function transactionReviewsQueryKey(budgetProfileId: string) {
  return ['transaction-reviews', budgetProfileId] as const
}

export function useTransactionReviews(budgetProfileId: string, enabled = true): {
  reviews: TransactionReview[]
  isLoading: boolean
} {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: transactionReviewsQueryKey(budgetProfileId),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/budgets/{id}/transaction-reviews', { params: { path: { id: budgetProfileId } } }))
        return { reviews: res.reviews.map(transactionReviewFromRest) }
      }
      return client.listTransactionReviews({ budgetProfileId })
    },
    enabled: enabled && !!budgetProfileId,
  })

  return { reviews: data?.reviews ?? [], isLoading }
}
