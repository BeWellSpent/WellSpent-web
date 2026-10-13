import { Timestamp } from '@bufbuild/protobuf'
import { FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { FrequencyUnit } from '@/gen/wellspent/v1/common_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

type RestFrequencyUnit = components['schemas']['FrequencyUnit']

const FREQUENCY_UNIT_FROM_REST: Record<RestFrequencyUnit, FrequencyUnit> = {
  month: FrequencyUnit.MONTH,
  week: FrequencyUnit.WEEK,
}

/** UNSPECIFIED and MONTH mean the same thing (see the proto field's own doc comment) — this client always sends a concrete unit, so UNSPECIFIED here is just the safe default. */
export function frequencyUnitToRest(unit: FrequencyUnit): RestFrequencyUnit {
  return unit === FrequencyUnit.WEEK ? 'week' : 'month'
}

function dateFromRest(value: string | null | undefined): Timestamp | undefined {
  return value ? Timestamp.fromDate(new Date(`${value}T00:00:00Z`)) : undefined
}

/** Normalizes the C# backend's REST `FixedExpense` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function fixedExpenseFromRest(dto: components['schemas']['FixedExpense']): FixedExpense {
  return new FixedExpense({
    id: dto.id,
    budgetProfileId: dto.budgetProfileId,
    name: dto.name,
    plannedAmount: moneyFromRest(dto.plannedAmount),
    categoryId: dto.categoryId,
    paymentMethodId: dto.paymentMethodId ?? '',
    dayOfMonth: dto.dayOfMonth,
    isActive: dto.isActive,
    intervalMonths: dto.intervalMonths,
    nextDueDate: dateFromRest(dto.nextDueDate),
    anchorDate: dateFromRest(dto.anchorDate),
    frequencyUnit: FREQUENCY_UNIT_FROM_REST[dto.frequencyUnit],
    intervalWeeks: dto.intervalWeeks,
    dayOfWeek: dto.dayOfWeek,
    endDate: dateFromRest(dto.endDate),
    totalPayments: dto.totalPayments,
    isInstallmentPlan: dto.isInstallmentPlan,
    paymentsMade: dto.paymentsMade,
  })
}
