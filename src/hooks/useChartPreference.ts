'use client'

import { ChartType } from '@/gen/wellspent/v1/common_pb'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'

export type ChartMode = 'pie' | 'bar'

/** Both tabs open as a pie unless the person chose otherwise. */
export const DEFAULT_CHART: ChartMode = 'pie'

export function chartTypeToMode(value: ChartType | undefined): ChartMode {
  if (value === ChartType.BAR) return 'bar'
  if (value === ChartType.PIE) return 'pie'
  return DEFAULT_CHART
}

export function modeToChartType(mode: ChartMode): ChartType {
  return mode === 'bar' ? ChartType.BAR : ChartType.PIE
}

/**
 * The person's saved default for one of the two chart tabs. Returns undefined
 * until their row has loaded, so callers can wait rather than render a pie and
 * snap to a bar a moment later.
 */
export function useChartPreference(budgetProfileId: string, tab: 'plan' | 'overview'): ChartMode | undefined {
  const { person, isLoading } = useMyBudgetPerson(budgetProfileId)
  if (isLoading) return undefined
  const stored = tab === 'plan' ? person?.planChartType : person?.overviewChartType
  return chartTypeToMode(stored)
}
