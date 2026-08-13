import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { resyncBlockedReason, hoursUntilResync } from '../resyncCooldown'

const NOW = new Date('2026-08-13T12:00:00Z')

function conn(overrides: Partial<PlaidConnection> = {}): PlaidConnection {
  return {
    id: 'c1',
    isOwner: true,
    syncEnabled: true,
    resyncAvailableAt: undefined,
    ...overrides,
  } as PlaidConnection
}

function availableAt(iso: string) {
  return { seconds: BigInt(Math.floor(new Date(iso).getTime() / 1000)) }
}

describe('resyncBlockedReason', () => {
  it('allows a resync on an owned, entitled connection that has never been resynced', () => {
    expect(resyncBlockedReason(conn(), NOW)).toBeNull()
  })

  it('blocks a connection the caller does not own', () => {
    expect(resyncBlockedReason(conn({ isOwner: false }), NOW)).toBe('notOwner')
  })

  it("blocks a connection whose owner isn't entitled to sync", () => {
    // Clearing the cursor here would discard the owner's place in the feed
    // and import nothing, since the sync job skips them on every run.
    expect(resyncBlockedReason(conn({ syncEnabled: false }), NOW)).toBe('syncDisabled')
  })

  it('reports ownership before entitlement, so a co-member never sees an upgrade prompt', () => {
    expect(resyncBlockedReason(conn({ isOwner: false, syncEnabled: false }), NOW)).toBe('notOwner')
  })

  it('blocks while the cooldown is still running', () => {
    const c = conn({ resyncAvailableAt: availableAt('2026-08-13T18:00:00Z') })
    expect(resyncBlockedReason(c, NOW)).toBe('cooldown')
  })

  it('allows again once the cooldown has passed', () => {
    const c = conn({ resyncAvailableAt: availableAt('2026-08-13T11:59:00Z') })
    expect(resyncBlockedReason(c, NOW)).toBeNull()
  })
})

describe('hoursUntilResync', () => {
  it('rounds up, so a partial hour never reads as fewer than it is', () => {
    // 90 minutes shown as "1 hour" would invite a retry that still fails.
    const c = conn({ resyncAvailableAt: availableAt('2026-08-13T13:30:00Z') })
    expect(hoursUntilResync(c, NOW)).toBe(2)
  })

  it('floors at 1 hour rather than saying 0 while still blocked', () => {
    const c = conn({ resyncAvailableAt: availableAt('2026-08-13T12:01:00Z') })
    expect(hoursUntilResync(c, NOW)).toBe(1)
  })

  it('returns 0 once the time has passed', () => {
    const c = conn({ resyncAvailableAt: availableAt('2026-08-13T11:00:00Z') })
    expect(hoursUntilResync(c, NOW)).toBe(0)
  })

  it('returns 0 when no cooldown is recorded at all', () => {
    expect(hoursUntilResync(conn(), NOW)).toBe(0)
  })
})
