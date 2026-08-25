/**
 * Remembering which versions the reader has already been shown notes for.
 *
 * Client-side on purpose, the same call as the status banner's dismissals:
 * "the first time this version is opened" is inherently per-install — the
 * browser on this machine has its own version — so a per-user column would be
 * the wrong shape and would need a write on every load. The trade-off is that
 * opening the app on a second device shows the notes again there.
 */

import type { DismissalStorage } from '@/components/status/dismissal'

const STORAGE_KEY = 'wellspent.changelogSeen'

/** Keys are component names; values are the last version announced. */
type SeenVersions = Record<string, string>

export function readSeen(storage: DismissalStorage | null): SeenVersions {
  if (!storage) return {}
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    // Anything else in this key is a corrupted write or someone else's data —
    // treat it as empty rather than throwing on every page load forever.
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

export function lastSeenVersion(storage: DismissalStorage | null, component: string): string | null {
  return readSeen(storage)[component] ?? null
}

export function markSeen(storage: DismissalStorage | null, component: string, version: string): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...readSeen(storage), [component]: version }))
  } catch {
    // Private browsing and full quotas both throw. Showing the notes again
    // next time is a far better outcome than crashing the app shell.
  }
}
