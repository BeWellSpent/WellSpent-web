import { FrequencyUnit } from '@/gen/wellspent/v1/common_pb'
import { fixedExpenseFromRest, frequencyUnitToRest } from '../fixedExpenseTransport'

describe('fixedExpenseFromRest', () => {
  it('normalizes a month-cadence REST fixed expense, converting date-only strings to timestamps', () => {
    const fe = fixedExpenseFromRest({
      id: 'fe1', budgetProfileId: 'p1', name: 'Rent', plannedAmount: { units: 1200, nanos: 0, currency: 'USD' },
      categoryId: 5, paymentMethodId: 'pm1', dayOfMonth: 1, isActive: true, intervalMonths: 1,
      nextDueDate: '2026-11-01', anchorDate: '2026-10-01', frequencyUnit: 'month', intervalWeeks: 1,
      dayOfWeek: 1, endDate: null, totalPayments: 0, isInstallmentPlan: false, paymentsMade: 0,
    })
    expect(fe.frequencyUnit).toBe(FrequencyUnit.MONTH)
    expect(fe.nextDueDate?.toDate().toISOString()).toBe('2026-11-01T00:00:00.000Z')
    expect(fe.anchorDate?.toDate().toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(fe.endDate).toBeUndefined()
  })

  it('normalizes a week-cadence installment-plan fixed expense', () => {
    const fe = fixedExpenseFromRest({
      id: 'fe2', budgetProfileId: 'p1', name: 'Card plan', plannedAmount: { units: 100, nanos: 0, currency: 'USD' },
      categoryId: 0, paymentMethodId: null, dayOfMonth: 0, isActive: true, intervalMonths: 1,
      nextDueDate: '2026-10-20', anchorDate: null, frequencyUnit: 'week', intervalWeeks: 1,
      dayOfWeek: 3, endDate: '2026-12-01', totalPayments: 6, isInstallmentPlan: true, paymentsMade: 2,
    })
    expect(fe.frequencyUnit).toBe(FrequencyUnit.WEEK)
    expect(fe.paymentMethodId).toBe('')
    expect(fe.isInstallmentPlan).toBe(true)
    expect(fe.paymentsMade).toBe(2)
  })
})

describe('frequencyUnitToRest', () => {
  it('maps WEEK to week and everything else to month', () => {
    expect(frequencyUnitToRest(FrequencyUnit.WEEK)).toBe('week')
    expect(frequencyUnitToRest(FrequencyUnit.MONTH)).toBe('month')
    expect(frequencyUnitToRest(FrequencyUnit.UNSPECIFIED)).toBe('month')
  })
})
