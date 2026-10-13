import { IncomeType, RecurringType } from '@/gen/wellspent/v1/common_pb'
import { incomeSourceFromRest, incomeTypeToRest, recurringTypeToRest } from '../incomeTransport'

describe('incomeSourceFromRest', () => {
  it('normalizes a REST income source, converting int64 ids to bigint and mapping its enums', () => {
    const source = incomeSourceFromRest({
      id: 7, budgetProfileId: 'p1', name: 'Salary', incomeType: 'salary',
      defaultAmount: { units: 5000, nanos: 0, currency: 'USD' },
      recurring: true, budgetPersonId: 2, paymentFrequency: 'monthly', beforeTax: true,
    })
    expect(source.id).toBe(7n)
    expect(source.incomeType).toBe(IncomeType.SALARY)
    expect(source.defaultAmount?.units).toBe(5000n)
    expect(source.budgetPersonId).toBe(2n)
    expect(source.paymentFrequency).toBe(RecurringType.MONTHLY)
  })
})

describe('incomeTypeToRest', () => {
  it('maps the 5 types the web client can send', () => {
    expect(incomeTypeToRest(IncomeType.SALARY)).toBe('salary')
    expect(incomeTypeToRest(IncomeType.HOURLY)).toBe('hourly')
    expect(incomeTypeToRest(IncomeType.FREELANCE)).toBe('freelance')
    expect(incomeTypeToRest(IncomeType.CONTRACTOR)).toBe('contractor')
    expect(incomeTypeToRest(IncomeType.INVESTMENT)).toBe('investment')
  })

  it('falls back to "other" for UNSPECIFIED, mirroring the Go backend default case exactly', () => {
    expect(incomeTypeToRest(IncomeType.UNSPECIFIED)).toBe('other')
  })
})

describe('recurringTypeToRest', () => {
  it('maps every known proto recurring type to its REST string', () => {
    expect(recurringTypeToRest(RecurringType.ONE_OFF)).toBe('one_off')
    expect(recurringTypeToRest(RecurringType.WEEKLY)).toBe('weekly')
    expect(recurringTypeToRest(RecurringType.BI_WEEKLY)).toBe('bi_weekly')
    expect(recurringTypeToRest(RecurringType.MONTHLY)).toBe('monthly')
    expect(recurringTypeToRest(RecurringType.YEARLY)).toBe('yearly')
  })

  it('falls back to "monthly" for UNSPECIFIED, mirroring the Go backend default case exactly', () => {
    expect(recurringTypeToRest(RecurringType.UNSPECIFIED)).toBe('monthly')
  })
})
