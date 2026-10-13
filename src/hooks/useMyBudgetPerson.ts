'use client'

import type { BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { useBudgetPeople } from '@/hooks/useBudgetPeople'
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
  const { people, isLoading } = useBudgetPeople(budgetProfileId)

  if (!userId) return { person: undefined, isLoading }
  return {
    person: people.find((p) => p.userId !== '' && p.userId === userId),
    isLoading,
  }
}
