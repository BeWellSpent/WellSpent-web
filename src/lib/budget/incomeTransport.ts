import { IncomeSource } from '@/gen/wellspent/v1/budget_pb'
import { IncomeType, RecurringType } from '@/gen/wellspent/v1/common_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

type RestIncomeType = components['schemas']['IncomeType']
type RestRecurringFrequency = components['schemas']['RecurringFrequency']

const INCOME_TYPE_FROM_REST: Record<RestIncomeType, IncomeType> = {
  salary: IncomeType.SALARY,
  hourly: IncomeType.HOURLY,
  freelance: IncomeType.FREELANCE,
  contractor: IncomeType.CONTRACTOR,
  investment: IncomeType.INVESTMENT,
  interest: IncomeType.INTEREST,
  one_time: IncomeType.ONE_TIME,
  gift: IncomeType.GIFT,
  other: IncomeType.OTHER,
}

const INCOME_TYPE_TO_REST: Partial<Record<IncomeType, RestIncomeType>> = {
  [IncomeType.SALARY]: 'salary',
  [IncomeType.HOURLY]: 'hourly',
  [IncomeType.FREELANCE]: 'freelance',
  [IncomeType.CONTRACTOR]: 'contractor',
  [IncomeType.INVESTMENT]: 'investment',
}

/** Mirrors Go's `incomeTypeStringFromProto` default case exactly — UNSPECIFIED (and INTEREST/ONE_TIME/GIFT/OTHER, which the web client never sends) all become "other" on the wire, same as today. */
export function incomeTypeToRest(type: IncomeType): RestIncomeType {
  return INCOME_TYPE_TO_REST[type] ?? 'other'
}

const RECURRING_FROM_REST: Record<RestRecurringFrequency, RecurringType> = {
  unspecified: RecurringType.UNSPECIFIED,
  one_off: RecurringType.ONE_OFF,
  weekly: RecurringType.WEEKLY,
  bi_weekly: RecurringType.BI_WEEKLY,
  monthly: RecurringType.MONTHLY,
  yearly: RecurringType.YEARLY,
}

const RECURRING_TO_REST: Partial<Record<RecurringType, RestRecurringFrequency>> = {
  [RecurringType.ONE_OFF]: 'one_off',
  [RecurringType.WEEKLY]: 'weekly',
  [RecurringType.BI_WEEKLY]: 'bi_weekly',
  [RecurringType.MONTHLY]: 'monthly',
  [RecurringType.YEARLY]: 'yearly',
}

/** Mirrors Go's `recurringTypeStringFromProto` default case exactly — UNSPECIFIED becomes "monthly", which is also what the web client always sends today (it never sets this field). */
export function recurringTypeToRest(type: RecurringType): RestRecurringFrequency {
  return RECURRING_TO_REST[type] ?? 'monthly'
}

/** Normalizes the C# backend's REST `IncomeSource` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function incomeSourceFromRest(dto: components['schemas']['IncomeSource']): IncomeSource {
  return new IncomeSource({
    id: BigInt(dto.id),
    budgetProfileId: dto.budgetProfileId,
    name: dto.name,
    incomeType: INCOME_TYPE_FROM_REST[dto.incomeType],
    defaultAmount: moneyFromRest(dto.defaultAmount),
    recurring: dto.recurring,
    budgetPersonId: BigInt(dto.budgetPersonId),
    paymentFrequency: RECURRING_FROM_REST[dto.paymentFrequency],
    beforeTax: dto.beforeTax,
  })
}
