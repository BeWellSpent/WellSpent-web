import { BudgetRole } from '@/gen/wellspent/v1/common_pb'

/** One person queued for creation, with an optional invitation attached. */
export interface PendingPerson {
  name: string
  /** Empty means "no account, no invite" — a name on the budget and nothing more. */
  email: string
  role: BudgetRole
}

/**
 * Roles an invite can grant.
 *
 * Admin is deliberately absent, matching `InvitePanel` and iOS's
 * `InvitesListView`: an admin can remove the person who invited them, which is
 * not a decision to hand over from a dropdown in a setup wizard. It can still
 * be granted afterwards from the People panel.
 */
export const INVITABLE_ROLES: BudgetRole[] = [BudgetRole.COLLABORATOR, BudgetRole.VIEWER]

/**
 * Deliberately permissive. The authoritative check is the server's, and this
 * only exists to stop an obvious typo becoming an invitation nobody receives —
 * a stricter pattern here would reject valid addresses the backend accepts.
 */
export function isValidInviteEmail(email: string): boolean {
  const trimmed = email.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}
