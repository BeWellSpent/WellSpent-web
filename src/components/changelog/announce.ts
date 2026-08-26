import type { ChangelogRelease } from '@/lib/api/restModels'

/**
 * Which releases to put in front of the reader, for one component.
 *
 * `releases` must be that component's own, newest first — the order the server
 * returns them in.
 *
 * Three rules, each earning its place:
 *
 * 1. **Nothing newer than what is actually running.** A deploy can publish
 *    notes before every browser has been served the new bundle, and announcing
 *    a version the reader does not have yet is worse than announcing nothing.
 *    For the server component `currentVersion` is what the API reports about
 *    itself, so the same rule holds there.
 * 2. **A first-ever run announces nothing.** Someone signing in for the first
 *    time should not be met with the entire history of the product; their
 *    current version is simply recorded as seen. The Help browser is where
 *    history lives.
 * 3. **Everything between what they last saw and now**, so a reader who skips
 *    three releases still learns what changed in all three — not just the
 *    newest.
 *
 * A `lastSeenVersion` that is not in the list at all (published notes were
 * removed, or history was truncated by the per-component limit) falls back to
 * the newest single release rather than replaying everything.
 */
export function releasesToAnnounce(
  releases: ChangelogRelease[],
  currentVersion: string,
  lastSeenVersion: string | null,
): ChangelogRelease[] {
  const currentIndex = releases.findIndex((r) => r.version === currentVersion)
  // No notes published for the running version yet: everything in the list is
  // either older (fine) or unreleased-to-this-client (not fine, but
  // indistinguishable here), so fall through to the full list and let the
  // last-seen rules below do the trimming.
  const visible = currentIndex === -1 ? releases : releases.slice(currentIndex)

  if (lastSeenVersion === null) return []

  const seenIndex = visible.findIndex((r) => r.version === lastSeenVersion)
  if (seenIndex === -1) return visible.slice(0, 1)
  return visible.slice(0, seenIndex)
}

/** The reader's language, falling back to English when there is no translation. */
export function localizedSummary(summaryEn: string, summaryEs: string, locale: string): string {
  if (locale.startsWith('es') && summaryEs.trim() !== '') return summaryEs
  return summaryEn
}
