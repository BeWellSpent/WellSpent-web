/**
 * What the app does, grouped like the app, and what each feature costs.
 * Tiers mirror what the app enforces today (docs/features/tiered-subscriptions.md):
 * `limited` is free but capped on the Free plan.
 */
export type Tier = 'free' | 'limited' | 'pro'

export type FeatureGroupKey = 'home' | 'plan' | 'transactions' | 'bank' | 'reports' | 'together'

type FeatureGroup = {
  key: FeatureGroupKey
  items: readonly { key: string; tier: Tier }[]
}

export const FEATURE_GROUPS: readonly FeatureGroup[] = [
  {
    key: 'home',
    items: [
      { key: 'glance', tier: 'free' },
      { key: 'people', tier: 'free' },
      { key: 'categories', tier: 'free' },
      { key: 'justMe', tier: 'free' },
    ],
  },
  {
    key: 'plan',
    items: [
      { key: 'plans', tier: 'free' },
      { key: 'bills', tier: 'free' },
      { key: 'paymentPlans', tier: 'free' },
      { key: 'comingUp', tier: 'pro' },
    ],
  },
  {
    key: 'transactions',
    items: [
      { key: 'entry', tier: 'free' },
      { key: 'flows', tier: 'free' },
      { key: 'payments', tier: 'free' },
      { key: 'anyPeriod', tier: 'free' },
    ],
  },
  {
    key: 'bank',
    items: [
      { key: 'sync', tier: 'pro' },
      { key: 'autoMatch', tier: 'pro' },
      { key: 'manualMatch', tier: 'pro' },
      { key: 'review', tier: 'free' },
    ],
  },
  {
    key: 'reports',
    items: [
      { key: 'trends', tier: 'limited' },
      { key: 'scorecard', tier: 'limited' },
      { key: 'history', tier: 'pro' },
    ],
  },
  {
    key: 'together',
    items: [
      { key: 'shared', tier: 'limited' },
      { key: 'paydays', tier: 'free' },
      { key: 'periodReview', tier: 'free' },
      { key: 'alerts', tier: 'limited' },
    ],
  },
]

/** Every `landing.features.groups.*` key the section asks for; the unit test checks each exists. */
export function featureGroupTranslationKeys(): string[] {
  return FEATURE_GROUPS.flatMap((group) => [
    `features.groups.${group.key}.title`,
    `features.groups.${group.key}.sub`,
    ...group.items.flatMap((item) => [
      `features.groups.${group.key}.items.${item.key}.name`,
      `features.groups.${group.key}.items.${item.key}.desc`,
    ]),
  ])
}
