import { BudgetCycle, BudgetRole, ChartType } from '@/gen/wellspent/v1/common_pb'
import {
  budgetCycleToRest, budgetPeriodFromRest, budgetProfileFromRest,
  budgetPersonFromRest, budgetPersonRoleToRest, chartTypeToRest,
} from '../budgetTransport'

describe('budgetProfileFromRest', () => {
  it('normalizes a REST profile, mapping its cycle string to the proto enum', () => {
    const profile = budgetProfileFromRest({
      id: 'p1', userId: 'u1', name: 'Household', cycle: 'monthly',
      countryCode: 'US', carryoverEnabled: true, autoUpdatePlannedAmount: false,
    })
    expect(profile.id).toBe('p1')
    expect(profile.cycle).toBe(BudgetCycle.MONTHLY)
    expect(profile.carryoverEnabled).toBe(true)
    expect(profile.autoUpdatePlannedAmount).toBe(false)
  })

  it('falls back to an empty country code when the REST value is nullish', () => {
    const profile = budgetProfileFromRest({
      id: 'p1', userId: 'u1', name: 'Household', cycle: 'weekly',
      countryCode: null, carryoverEnabled: false, autoUpdatePlannedAmount: true,
    })
    expect(profile.countryCode).toBe('')
    expect(profile.cycle).toBe(BudgetCycle.WEEKLY)
  })
})

describe('budgetPeriodFromRest', () => {
  it('normalizes a REST period, converting its date-only strings to timestamps', () => {
    const period = budgetPeriodFromRest({
      id: 'pe1', budgetProfileId: 'p1', startDate: '2026-10-01', endDate: '2026-10-31', isArchived: false,
    })
    expect(period.startDate?.toDate().toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(period.endDate?.toDate().toISOString()).toBe('2026-10-31T00:00:00.000Z')
    expect(period.isArchived).toBe(false)
  })
})

describe('budgetCycleToRest', () => {
  it('maps every known proto cycle to its REST string', () => {
    expect(budgetCycleToRest(BudgetCycle.WEEKLY)).toBe('weekly')
    expect(budgetCycleToRest(BudgetCycle.BI_WEEKLY)).toBe('bi_weekly')
    expect(budgetCycleToRest(BudgetCycle.MONTHLY)).toBe('monthly')
    expect(budgetCycleToRest(BudgetCycle.YEARLY)).toBe('yearly')
  })

  it('falls back to monthly for an unmapped (UNSPECIFIED) cycle', () => {
    expect(budgetCycleToRest(BudgetCycle.UNSPECIFIED)).toBe('monthly')
  })
})

describe('budgetPersonFromRest', () => {
  it('normalizes a REST person, converting its int64 id to bigint and mapping role/chart enums', () => {
    const person = budgetPersonFromRest({
      id: 42, budgetProfileId: 'p1', userName: 'Ann', userId: 'u1', color: '#fff',
      role: 'admin', planChartType: 'bar', overviewChartType: 'pie',
      manualMatchReviewEnabled: true, focusedViewEnabled: false,
    })
    expect(person.id).toBe(42n)
    expect(person.role).toBe(BudgetRole.ADMIN)
    expect(person.planChartType).toBe(ChartType.BAR)
    expect(person.overviewChartType).toBe(ChartType.PIE)
  })

  it('falls back to empty strings for a nullish userName/userId, and UNSPECIFIED for a null chart type', () => {
    const person = budgetPersonFromRest({
      id: 1, budgetProfileId: 'p1', userName: null, userId: null, color: '',
      role: 'unspecified', planChartType: null, overviewChartType: null,
      manualMatchReviewEnabled: true, focusedViewEnabled: false,
    })
    expect(person.userName).toBe('')
    expect(person.userId).toBe('')
    expect(person.role).toBe(BudgetRole.UNSPECIFIED)
    expect(person.planChartType).toBe(ChartType.UNSPECIFIED)
  })
})

describe('budgetPersonRoleToRest', () => {
  it('maps admin/collaborator/viewer to their REST strings', () => {
    expect(budgetPersonRoleToRest(BudgetRole.ADMIN)).toBe('admin')
    expect(budgetPersonRoleToRest(BudgetRole.COLLABORATOR)).toBe('collaborator')
    expect(budgetPersonRoleToRest(BudgetRole.VIEWER)).toBe('viewer')
  })

  it('falls back to viewer for an unmapped (UNSPECIFIED) role', () => {
    expect(budgetPersonRoleToRest(BudgetRole.UNSPECIFIED)).toBe('viewer')
  })
})

describe('chartTypeToRest', () => {
  it('maps PIE/BAR to their REST strings and UNSPECIFIED to null', () => {
    expect(chartTypeToRest(ChartType.PIE)).toBe('pie')
    expect(chartTypeToRest(ChartType.BAR)).toBe('bar')
    expect(chartTypeToRest(ChartType.UNSPECIFIED)).toBeNull()
  })
})
