import { groupPeriodsByYear } from '../periodGrouping'
import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'

function makePeriod(id: string, seconds: bigint, isArchived = false): BudgetPeriod {
  return {
    id,
    budgetProfileId: 'profile-1',
    startDate: { seconds, nanos: 0 },
    endDate: { seconds, nanos: 0 },
    isArchived,
  } as BudgetPeriod
}

describe('groupPeriodsByYear', () => {
  it('groups periods into the correct calendar year', () => {
    const jan2025 = makePeriod('p1', 1735689600n) // 2025-01-01T00:00:00Z
    const mid2026 = makePeriod('p2', 1782000000n) // 2026-06-21T00:00:00Z -- still 2026
    const groups = groupPeriodsByYear([jan2025, mid2026])
    expect(groups.map((g) => g.year)).toEqual([2026, 2025])
  })

  it('sorts years most-recent-first', () => {
    const y2024 = makePeriod('p1', 1704067200n) // 2024-01-01
    const y2026 = makePeriod('p2', 1767225600n) // 2026-01-01
    const y2025 = makePeriod('p3', 1735689600n) // 2025-01-01
    const groups = groupPeriodsByYear([y2024, y2026, y2025])
    expect(groups.map((g) => g.year)).toEqual([2026, 2025, 2024])
  })

  it('sorts periods within a year most-recent-first', () => {
    const jan = makePeriod('jan', 1735689600n) // 2025-01-01
    const jun = makePeriod('jun', 1748736000n) // 2025-06-01
    const groups = groupPeriodsByYear([jan, jun])
    expect(groups[0].periods.map((p) => p.id)).toEqual(['jun', 'jan'])
  })

  it('returns an empty array for no periods', () => {
    expect(groupPeriodsByYear([])).toEqual([])
  })

  it('includes archived periods alongside the active one within a year', () => {
    const archived = makePeriod('archived', 1735689600n, true)
    const active = makePeriod('active', 1748736000n, false)
    const groups = groupPeriodsByYear([archived, active])
    expect(groups[0].periods.map((p) => p.id)).toEqual(['active', 'archived'])
  })
})
