import { Timestamp } from '@bufbuild/protobuf'
import { BudgetPeriod, BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import { BudgetCycle } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

type RestCycle = components['schemas']['BudgetCycle']

const CYCLE_FROM_REST: Record<RestCycle, BudgetCycle> = {
  weekly: BudgetCycle.WEEKLY,
  bi_weekly: BudgetCycle.BI_WEEKLY,
  monthly: BudgetCycle.MONTHLY,
  yearly: BudgetCycle.YEARLY,
}

const CYCLE_TO_REST: Partial<Record<BudgetCycle, RestCycle>> = {
  [BudgetCycle.WEEKLY]: 'weekly',
  [BudgetCycle.BI_WEEKLY]: 'bi_weekly',
  [BudgetCycle.MONTHLY]: 'monthly',
  [BudgetCycle.YEARLY]: 'yearly',
}

/** `CreateBudgetProfileRequest.cycle` never accepts unspecified — monthly matches this repo's own fallback (`BudgetSetupFlow` always creates monthly). */
export function budgetCycleToRest(cycle: BudgetCycle): RestCycle {
  return CYCLE_TO_REST[cycle] ?? 'monthly'
}

/** Normalizes the C# backend's REST `BudgetProfile` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function budgetProfileFromRest(dto: components['schemas']['BudgetProfile']): BudgetProfile {
  return new BudgetProfile({
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    cycle: CYCLE_FROM_REST[dto.cycle],
    countryCode: dto.countryCode ?? '',
    carryoverEnabled: dto.carryoverEnabled,
    autoUpdatePlannedAmount: dto.autoUpdatePlannedAmount,
  })
}

/** Same normalization for `BudgetPeriod` — REST's `startDate`/`endDate` are date-only strings, converted to proto `Timestamp`s at UTC midnight. */
export function budgetPeriodFromRest(dto: components['schemas']['BudgetPeriod']): BudgetPeriod {
  return new BudgetPeriod({
    id: dto.id,
    budgetProfileId: dto.budgetProfileId,
    startDate: Timestamp.fromDate(new Date(`${dto.startDate}T00:00:00Z`)),
    endDate: Timestamp.fromDate(new Date(`${dto.endDate}T00:00:00Z`)),
    isArchived: dto.isArchived,
  })
}
