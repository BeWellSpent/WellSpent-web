import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { INVITABLE_ROLES, isValidInviteEmail } from '../pendingPerson'

describe('isValidInviteEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidInviteEmail('jane@example.com')).toBe(true)
    expect(isValidInviteEmail('  jane.doe+budget@sub.example.co.uk  ')).toBe(true)
  })

  it('rejects the typos this exists to catch', () => {
    expect(isValidInviteEmail('jane')).toBe(false)
    expect(isValidInviteEmail('jane@')).toBe(false)
    expect(isValidInviteEmail('jane@example')).toBe(false)
    expect(isValidInviteEmail('jane example@test.com')).toBe(false)
  })

  it('treats blank as invalid, leaving the caller to decide it means "no invite"', () => {
    expect(isValidInviteEmail('')).toBe(false)
    expect(isValidInviteEmail('   ')).toBe(false)
  })
})

describe('INVITABLE_ROLES', () => {
  // Admin can remove the person who invited them. Both clients' invite panels
  // already exclude it, and the setup wizard must not become the one place it
  // can be handed out.
  it('does not offer Admin', () => {
    expect(INVITABLE_ROLES).not.toContain(BudgetRole.ADMIN)
    expect(INVITABLE_ROLES).toEqual([BudgetRole.COLLABORATOR, BudgetRole.VIEWER])
  })
})
