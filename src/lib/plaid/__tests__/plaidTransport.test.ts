import { plaidConnectionFromRest, syncWarningFromRest } from '../plaidTransport'

describe('plaidConnectionFromRest', () => {
  it('normalizes a REST connection, converting both nullable timestamps', () => {
    const conn = plaidConnectionFromRest({
      id: 'c1', institutionId: 'ins_1', institutionName: 'Chase', status: 'active',
      lastSyncedAt: '2026-10-10T00:00:00Z', budgetProfileId: 'b1', ownerName: 'Ann',
      isOwner: true, syncEnabled: true, resyncAvailableAt: '2026-10-12T00:00:00Z',
    })
    expect(conn.status).toBe('active')
    expect(conn.lastSyncedAt?.toDate().toISOString()).toBe('2026-10-10T00:00:00.000Z')
    expect(conn.resyncAvailableAt?.toDate().toISOString()).toBe('2026-10-12T00:00:00.000Z')
  })

  it('leaves both timestamps unset when the REST value is null', () => {
    const conn = plaidConnectionFromRest({
      id: 'c1', institutionId: 'ins_1', institutionName: 'Chase', status: 'disconnected',
      lastSyncedAt: null, budgetProfileId: 'b1', ownerName: 'Ann',
      isOwner: false, syncEnabled: false, resyncAvailableAt: null,
    })
    expect(conn.lastSyncedAt).toBeUndefined()
    expect(conn.resyncAvailableAt).toBeUndefined()
  })
})

describe('syncWarningFromRest', () => {
  it('normalizes a REST sync warning', () => {
    const warning = syncWarningFromRest({
      budgetProfileId: 'b1', budgetName: 'Household', memberName: 'Bob',
      connectionCount: 2, isCurrentUser: false,
    })
    expect(warning.budgetName).toBe('Household')
    expect(warning.connectionCount).toBe(2)
    expect(warning.isCurrentUser).toBe(false)
  })
})
