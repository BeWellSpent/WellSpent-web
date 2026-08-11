/**
 * Pure rules behind the email-verification gate.
 *
 * Kept out of the components so they're testable without mocking next-intl or
 * react-query, and so web and iOS can be checked against the same statements
 * of the rule rather than two independently-drifting inline conditions.
 */

/** Matches the backend's ResendVerificationEmail throttle. */
export const RESEND_COOLDOWN_MS = 60_000

/** Same normalization the backend applies before storing or comparing. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Deliberately loose — the backend's net/mail parse is the real check. This
 * exists only to keep the submit button disabled on obvious nonsense rather
 * than spending a round trip to say so.
 */
export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Mirrors the backend's ChangeEmail preconditions: a valid address that isn't
 * the one already on the account. The backend rejects an unchanged address
 * rather than succeeding silently, so blocking it here turns a confusing
 * error into a disabled button.
 */
export function canSubmitEmailChange(raw: string, currentEmail: string): boolean {
  return isValidEmail(raw) && normalizeEmail(raw) !== normalizeEmail(currentEmail)
}
