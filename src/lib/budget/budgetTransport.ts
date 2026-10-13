import { Timestamp } from '@bufbuild/protobuf'
import { BudgetPeriod, BudgetPerson, BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import { BudgetCycle, BudgetRole, ChartType } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

type RestCycle = components['schemas']['BudgetCycle']
type RestPersonRole = components['schemas']['BudgetPersonRole']
type RestChartType = components['schemas']['ChartType']

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

const PERSON_ROLE_FROM_REST: Record<RestPersonRole, BudgetRole> = {
  unspecified: BudgetRole.UNSPECIFIED,
  admin: BudgetRole.ADMIN,
  collaborator: BudgetRole.COLLABORATOR,
  viewer: BudgetRole.VIEWER,
}

const PERSON_ROLE_TO_REST: Partial<Record<BudgetRole, 'admin' | 'collaborator' | 'viewer'>> = {
  [BudgetRole.ADMIN]: 'admin',
  [BudgetRole.COLLABORATOR]: 'collaborator',
  [BudgetRole.VIEWER]: 'viewer',
}

/** `UpdateBudgetPersonRoleRequest.role` never accepts unspecified — this is only ever called with a role chosen from a 3-way picker, so the fallback is never actually hit. */
export function budgetPersonRoleToRest(role: BudgetRole): 'admin' | 'collaborator' | 'viewer' {
  return PERSON_ROLE_TO_REST[role] ?? 'viewer'
}

function chartTypeFromRest(value: RestChartType | undefined): ChartType {
  if (value === 'pie') return ChartType.PIE
  if (value === 'bar') return ChartType.BAR
  return ChartType.UNSPECIFIED
}

/** `UpdateMyBudgetPreferencesRequest`'s fields — null means "use the client default", same meaning as proto's UNSPECIFIED. */
export function chartTypeToRest(value: ChartType): RestChartType {
  if (value === ChartType.PIE) return 'pie'
  if (value === ChartType.BAR) return 'bar'
  return null
}

/** Normalizes the C# backend's REST `BudgetPerson` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function budgetPersonFromRest(dto: components['schemas']['BudgetPerson']): BudgetPerson {
  return new BudgetPerson({
    id: BigInt(dto.id),
    budgetProfileId: dto.budgetProfileId,
    userName: dto.userName ?? '',
    userId: dto.userId ?? '',
    color: dto.color,
    role: PERSON_ROLE_FROM_REST[dto.role],
    planChartType: chartTypeFromRest(dto.planChartType),
    overviewChartType: chartTypeFromRest(dto.overviewChartType),
    manualMatchReviewEnabled: dto.manualMatchReviewEnabled,
    focusedViewEnabled: dto.focusedViewEnabled,
  })
}
