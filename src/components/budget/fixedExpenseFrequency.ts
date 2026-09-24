export type FrequencyUnitUI = 'week' | 'month' | 'year'

export const FREQUENCY_COUNT_RANGE: Record<FrequencyUnitUI, { min: number; max: number }> = {
  week: { min: 1, max: 52 },
  month: { min: 1, max: 24 },
  year: { min: 1, max: 10 },
}

/** Wire fields for a frequency/count pair. frequencyUnit: 1 = MONTH, 2 = WEEK. */
export function frequencyFieldsFor(unit: FrequencyUnitUI, count: number, dayOfWeek: number) {
  if (unit === 'week') {
    return { frequencyUnit: 2, intervalMonths: 1, intervalWeeks: count, dayOfWeek }
  }
  return { frequencyUnit: 1, intervalMonths: unit === 'year' ? count * 12 : count, intervalWeeks: 1, dayOfWeek: 1 }
}
