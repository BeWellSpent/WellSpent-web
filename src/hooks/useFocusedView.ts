'use client'

import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'

/** Whether the caller's own Focused View preference is on for this budget. */
export function useFocusedView(budgetProfileId: string): boolean {
  const { person } = useMyBudgetPerson(budgetProfileId)
  return person?.focusedViewEnabled ?? false
}
