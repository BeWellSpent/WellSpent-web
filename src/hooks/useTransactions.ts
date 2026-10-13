'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { transactionFromRest, transactionTypeIdToRest } from '@/lib/budget/transactionTransport'
import { isEnabled } from '@/lib/config/features'

interface Options {
  /** 0/omitted = no filter, 1 = Fixed, 2 = Variable — matches `transaction_type` lookup ids. */
  transactionTypeId?: number
  focusedView?: boolean
  enabled?: boolean
}

/** The one cache key for `listTransactions` for a given period/type/focused-view combination. */
function transactionsQueryKey(budgetPeriodId: string | undefined, options: Options = {}) {
  return ['transactions', budgetPeriodId, options.transactionTypeId ?? 0, options.focusedView ?? false] as const
}

export function useTransactions(budgetPeriodId: string | undefined, options: Options = {}): {
  transactions: Transaction[]
  isLoading: boolean
} {
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()
  const { transactionTypeId = 0, focusedView = false, enabled = true } = options

  const { data, isLoading } = useQuery({
    queryKey: transactionsQueryKey(budgetPeriodId, options),
    queryFn: async () => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/transactions', {
          params: {
            query: {
              budgetPeriodId: budgetPeriodId!,
              transactionType: transactionTypeId ? transactionTypeIdToRest(transactionTypeId) : undefined,
              focusedView,
            },
          },
        }))
        return { transactions: res.transactions.map(transactionFromRest) }
      }
      return client.listTransactions({ budgetPeriodId, transactionTypeId, focusedView })
    },
    enabled: enabled && !!budgetPeriodId,
  })

  return { transactions: data?.transactions ?? [], isLoading }
}
