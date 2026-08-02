import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'

export interface YearGroup {
  year: number
  periods: BudgetPeriod[]
}

/**
 * Groups periods by calendar year (derived from `start_date`, read as UTC —
 * DATE-only columns cross the wire as midnight-UTC timestamps, so reading in
 * local time can shift the derived year by one day near a year boundary in
 * negative-UTC-offset timezones). Years are returned most-recent-first;
 * periods within a year are sorted most-recent-first.
 */
export function groupPeriodsByYear(periods: BudgetPeriod[]): YearGroup[] {
  const byYear = new Map<number, BudgetPeriod[]>()
  for (const period of periods) {
    const seconds = period.startDate?.seconds ?? 0n
    const year = new Date(Number(seconds) * 1000).getUTCFullYear()
    const existing = byYear.get(year)
    if (existing) {
      existing.push(period)
    } else {
      byYear.set(year, [period])
    }
  }

  return [...byYear.keys()]
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      periods: [...byYear.get(year)!].sort(
        (a, b) => Number(b.startDate?.seconds ?? 0n) - Number(a.startDate?.seconds ?? 0n)
      ),
    }))
}
