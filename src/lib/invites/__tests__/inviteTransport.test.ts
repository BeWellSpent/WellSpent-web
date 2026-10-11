import { inviteFromRest, inviteRoleToRest } from '../inviteTransport'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { InviteStatus } from '@/gen/wellspent/v1/invite_pb'

describe('inviteFromRest', () => {
  it('normalizes role/status strings and timestamps into the proto shape', () => {
    const invite = inviteFromRest({
      id: 'i1', budgetProfileId: 'b1', budgetName: 'My Budget', inviterName: 'Ann',
      email: 'bob@example.com', role: 'viewer', status: 'pending',
      expiresAt: '2026-10-18T00:00:00Z', createdAt: '2026-10-11T00:00:00Z', budgetPersonId: null,
    })
    expect(invite.role).toBe(BudgetRole.VIEWER)
    expect(invite.status).toBe(InviteStatus.PENDING)
    expect(invite.expiresAt?.toDate().toISOString()).toBe('2026-10-18T00:00:00.000Z')
    expect(invite.budgetPersonId).toBe(0n)
  })

  it.each([
    ['accepted', InviteStatus.ACCEPTED],
    ['cancelled', InviteStatus.CANCELLED],
    ['expired', InviteStatus.EXPIRED],
  ])('maps REST status %s to proto InviteStatus %s', (restStatus, expected) => {
    const invite = inviteFromRest({
      id: 'i1', budgetProfileId: 'b1', budgetName: '', inviterName: '', email: 'bob@example.com',
      role: 'collaborator', status: restStatus as never, expiresAt: '2026-10-18T00:00:00Z',
      createdAt: '2026-10-11T00:00:00Z', budgetPersonId: null,
    })
    expect(invite.status).toBe(expected)
  })

  it('carries a non-null budgetPersonId through as a bigint', () => {
    const invite = inviteFromRest({
      id: 'i1', budgetProfileId: 'b1', budgetName: '', inviterName: '', email: 'bob@example.com',
      role: 'admin', status: 'pending', expiresAt: '2026-10-18T00:00:00Z',
      createdAt: '2026-10-11T00:00:00Z', budgetPersonId: 42,
    })
    expect(invite.role).toBe(BudgetRole.ADMIN)
    expect(invite.budgetPersonId).toBe(42n)
  })
})

describe('inviteRoleToRest', () => {
  it('maps collaborator and viewer through unchanged', () => {
    expect(inviteRoleToRest(BudgetRole.COLLABORATOR)).toBe('collaborator')
    expect(inviteRoleToRest(BudgetRole.VIEWER)).toBe('viewer')
  })

  it('falls back to collaborator for admin — SendBudgetInviteRequest never accepts it', () => {
    expect(inviteRoleToRest(BudgetRole.ADMIN)).toBe('collaborator')
  })
})
