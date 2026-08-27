import type { User } from '@/gen/wellspent/v1/user_pb'

/**
 * Whether an account has the profile information the app needs to work.
 *
 * Only `country_code` is checked, and only because it is the one field a
 * sign-up can complete without: `Register` collects it, but `GoogleExchange`
 * and `AppleSignIn` never receive it, so every social sign-up lands with it
 * null. That silently disables before-tax income and the tax reserve, and
 * propagates to `budget_profile.country_code` at creation, so the budget
 * inherits the gap permanently.
 *
 * State and filing status are deliberately *not* required. They are US-only,
 * a non-US account has no valid value for either, and treating them as
 * mandatory would gate everyone on a question that does not apply to them.
 */
export function isProfileComplete(user: Pick<User, 'countryCode'>): boolean {
  return user.countryCode.trim() !== ''
}
