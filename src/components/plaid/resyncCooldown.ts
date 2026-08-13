import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'

/**
 * Why a connection's resync button is unavailable, or `null` when it's usable.
 *
 * The backend refuses each of these too — this only decides what the button
 * looks like, so the user learns the reason before clicking rather than from
 * an error afterwards.
 */
export type ResyncBlockedReason = 'notOwner' | 'syncDisabled' | 'cooldown'

export function resyncBlockedReason(
  conn: PlaidConnection,
  now: Date = new Date(),
): ResyncBlockedReason | null {
  if (!conn.isOwner) return 'notOwner'
  if (!conn.syncEnabled) return 'syncDisabled'
  if (conn.resyncAvailableAt && timestampToDate(conn.resyncAvailableAt) > now) return 'cooldown'
  return null
}

/**
 * Whole hours until the next resync is allowed, rounded up and floored at 1.
 *
 * Rounding up matters: 90 minutes left rendered as "1 hour" invites a retry
 * that still fails. Anything under an hour says 1 rather than 0 for the same
 * reason.
 */
export function hoursUntilResync(conn: PlaidConnection, now: Date = new Date()): number {
  if (!conn.resyncAvailableAt) return 0
  const ms = timestampToDate(conn.resyncAvailableAt).getTime() - now.getTime()
  if (ms <= 0) return 0
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)))
}

/**
 * Proto timestamps arrive as `{ seconds: bigint }`, which `new Date()` won't
 * take directly.
 */
function timestampToDate(ts: { seconds: bigint }): Date {
  return new Date(Number(ts.seconds) * 1000)
}
