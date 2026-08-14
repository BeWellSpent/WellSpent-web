'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useAuth } from '@/context/AuthContext'

/**
 * The current user's own BudgetPerson row on a budget, or undefined while
 * loading / when they aren't a linked member.
 *
 * Extracted so role and per-person preferences resolve the same row the same
 * way. Both read from the `budget-people` query the budget screens already
 * populate, so this costs no extra request.
 *
 * `isLoading` is exposed because callers must distinguish "not a member" from
 * "not loaded yet" — `useBudgetRole` treats the latter as Admin so controls
 * don't flash away on first render.
 */
export function useMyBudgetPerson(budgetProfileId: string): { person: BudgetPerson | undefined; isLoading: boolean } {
  const { userId } = useAuth()
  const client = useClient(BudgetService)

  const { data, isLoading } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  if (!data || !userId) return { person: undefined, isLoading }
  return {
    person: data.people.find((p) => p.userId !== '' && p.userId === userId),
    isLoading,
  }
}
