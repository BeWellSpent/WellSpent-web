import { resolveActivePeriod, resolvePeriod } from '../resolvePeriod'
import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'

function makePeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'period-1',
    budgetProfileId: 'profile-1',
    startDate: { seconds: 0n, nanos: 0 },
    endDate: { seconds: 0n, nanos: 0 },
    isArchived: false,
    ...overrides,
  } as BudgetPeriod
}

describe('resolveActivePeriod', () => {
  it('returns the non-archived period', () => {
    const archived = makePeriod({ id: 'p1', isArchived: true, startDate: { seconds: 100n, nanos: 0 } })
    const active = makePeriod({ id: 'p2', isArchived: false, startDate: { seconds: 200n, nanos: 0 } })
    expect(resolveActivePeriod([archived, active])?.id).toBe('p2')
  })

  it('picks the most recent non-archived period when more than one exists', () => {
    const older = makePeriod({ id: 'p1', isArchived: false, startDate: { seconds: 100n, nanos: 0 } })
    const newer = makePeriod({ id: 'p2', isArchived: false, startDate: { seconds: 200n, nanos: 0 } })
    expect(resolveActivePeriod([older, newer])?.id).toBe('p2')
  })

  it('falls back to the first period when every period is archived', () => {
    const p1 = makePeriod({ id: 'p1', isArchived: true })
    const p2 = makePeriod({ id: 'p2', isArchived: true })
    expect(resolveActivePeriod([p1, p2])?.id).toBe('p1')
  })

  it('returns undefined for an empty list', () => {
    expect(resolveActivePeriod([])).toBeUndefined()
  })
})

describe('resolvePeriod', () => {
  const archived = makePeriod({ id: 'p-archived', isArchived: true, startDate: { seconds: 100n, nanos: 0 } })
  const active = makePeriod({ id: 'p-active', isArchived: false, startDate: { seconds: 200n, nanos: 0 } })
  const periods = [archived, active]

  it('returns the active period when no override id is given', () => {
    expect(resolvePeriod(periods, null)?.id).toBe('p-active')
    expect(resolvePeriod(periods, undefined)?.id).toBe('p-active')
  })

  it('returns the overridden (archived) period when its id matches', () => {
    expect(resolvePeriod(periods, 'p-archived')?.id).toBe('p-archived')
  })

  it('falls back to the active period when the override id matches nothing', () => {
    expect(resolvePeriod(periods, 'does-not-exist')?.id).toBe('p-active')
  })
})
