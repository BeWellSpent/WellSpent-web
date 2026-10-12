'use client'

import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useBudgetProfile } from '@/hooks/useBudgetProfile'
import { useAuth } from '@/context/AuthContext'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'

/**
 * Resolves the current user's role for a given budget profile.
 * Returns ADMIN while loading (optimistic) so buttons don't flash away on first render.
 * Profile owners always return ADMIN regardless of the person mapping.
 */
export function useBudgetRole(budgetProfileId: string): BudgetRole {
  const { userId } = useAuth()
  const { profile } = useBudgetProfile(budgetProfileId)
  const { person: myPerson, isLoading: personLoading } = useMyBudgetPerson(budgetProfileId)

  if (!profile || personLoading) return BudgetRole.ADMIN

  if (userId && profile.userId && profile.userId === userId) return BudgetRole.ADMIN

  return myPerson?.role ?? BudgetRole.UNSPECIFIED
}
