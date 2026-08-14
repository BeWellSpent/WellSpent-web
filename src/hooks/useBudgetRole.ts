'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useAuth } from '@/context/AuthContext'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'

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

  const { person: myPerson, isLoading: personLoading } = useMyBudgetPerson(budgetProfileId)

  if (!profileData || personLoading) return BudgetRole.ADMIN

  const profile = profileData.profile
  if (userId && profile?.userId && profile.userId === userId) return BudgetRole.ADMIN

  return myPerson?.role ?? BudgetRole.UNSPECIFIED
}
