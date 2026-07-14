'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useAuth } from '@/context/AuthContext'

/**
 * Resolves the current user's role for a given budget profile.
 * Returns ADMIN while loading (optimistic) so buttons don't flash away on first render.
 * Profile owners always return ADMIN regardless of the person mapping.
 */
export function useBudgetRole(budgetProfileId: string): BudgetRole {
  const { userId } = useAuth()
  const client = useClient(BudgetService)

  const { data: profileData } = useQuery({
    queryKey: ['budget-profile', budgetProfileId],
    queryFn: () => client.getBudgetProfile({ id: budgetProfileId }),
  })

  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  if (!profileData || !peopleData) return BudgetRole.ADMIN

  const profile = profileData.profile
  const people = peopleData.people

  if (userId && profile?.userId && profile.userId === userId) return BudgetRole.ADMIN

  const myPerson = people.find((p) => p.userId !== '' && p.userId === userId)
  return myPerson?.role ?? BudgetRole.UNSPECIFIED
}
