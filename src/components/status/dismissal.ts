/**
 * Remembering which banners the reader has already closed.
 *
 * Kept client-side on purpose. Storing it per-user would need a table and an
 * authenticated RPC, and would still fail for signed-out visitors — who are
 * exactly the people reading an outage banner. The trade-off is that a
 * dismissal doesn't follow you to another device.
 */

const STORAGE_KEY = 'wellspent.statusBannerDismissed'

/**
 * How many IDs to remember. One key holding a capped list, rather than one key
 * per banner, so this can't grow without bound in someone's browser over the
 * years. Only one banner is ever live, so a short history is plenty — an ID
 * falling off the end belongs to a banner that expired long ago and will never
 * be returned again.
 */
const MAX_REMEMBERED = 20

/**
 * Storage is passed in rather than read off `window`, so this is testable
 * without a DOM and safe to call during SSR (where the caller passes null).
 */
export type DismissalStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readDismissed(storage: DismissalStorage | null): string[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    // Anything else in this key is someone else's data or a corrupted write —
    // treat it as empty rather than throwing on every page load forever.
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function isDismissed(storage: DismissalStorage | null, bannerId: string): boolean {
  return readDismissed(storage).includes(bannerId)
}

export function markDismissed(storage: DismissalStorage | null, bannerId: string): void {
  if (!storage) return
  const existing = readDismissed(storage).filter((id) => id !== bannerId)
  const next = [bannerId, ...existing].slice(0, MAX_REMEMBERED)
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private browsing and full quotas both throw here. A dismissal that
    // doesn't stick is a far better outcome than a crash at the top of every
    // page.
  }
}

/** `null` during SSR, where there is no `window`. */
export function browserStorage(): DismissalStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    // Blocked entirely by some privacy settings — accessing the property
    // itself throws, before any read.
    return null
  }
}
