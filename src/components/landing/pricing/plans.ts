/** What each plan includes, as keys under `landing.pricing`. Mirrors what the app enforces. */
export const FREE_ITEMS = ['budget', 'income', 'planning', 'transactions', 'reports', 'alerts', 'taxReserve', 'ads'] as const

export const PRO_ITEMS = ['unlimited', 'bankSync', 'matching', 'history', 'comingUp', 'alerts', 'noAds'] as const

/** Side-by-side rows; `none` renders the Free cell muted. */
export const COMPARISON_ROWS = [
  { key: 'people' },
  { key: 'income' },
  { key: 'planning' },
  { key: 'transactions' },
  { key: 'bankSync', none: true },
  { key: 'matching', none: true },
  { key: 'reports' },
  { key: 'comingUp' },
  { key: 'alerts' },
  { key: 'ads' },
] as const

/** Every `landing.pricing.*` key built from the lists above; the unit test checks each exists. */
export function pricingTranslationKeys(): string[] {
  return [
    ...FREE_ITEMS.map((k) => `pricing.freeItems.${k}`),
    ...PRO_ITEMS.map((k) => `pricing.proItems.${k}`),
    ...COMPARISON_ROWS.flatMap(({ key }) => [
      `pricing.rows.${key}.name`,
      `pricing.rows.${key}.free`,
      `pricing.rows.${key}.pro`,
    ]),
  ]
}
