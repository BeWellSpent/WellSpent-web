'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { PaymentMethod } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'

/**
 * The one cache key for a budget's payment methods.
 *
 * There used to be two — `['paymentMethods', id]` and `['payment-methods', id]` —
 * for the same RPC, so mutations invalidated half the readers and adding a
 * method left the Add Transaction dropdown showing none. Import this rather
 * than writing the key out again.
 */
export function paymentMethodsQueryKey(budgetProfileId: string) {
  return ['paymentMethods', budgetProfileId] as const
}

export function usePaymentMethods(budgetProfileId: string): {
  methods: PaymentMethod[]
  isLoading: boolean
} {
  const client = useClient(BudgetService)

  const { data, isLoading } = useQuery({
    queryKey: paymentMethodsQueryKey(budgetProfileId),
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })

  return { methods: data?.methods ?? [], isLoading }
}
