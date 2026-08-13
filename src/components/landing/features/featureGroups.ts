import { SHOWCASE } from '../showcase/showcaseAssets'

/**
 * The feature groups, each of which gets its own route under
 * `/[locale]/features/<key>`.
 *
 * The nav dropdown, the features index, and every detail page read from this
 * one array, so adding a group adds it everywhere at once.
 *
 * Order mirrors the app's own budget-view tabs (Plan, Transactions, Reports)
 * followed by the budget-management panels, so a visitor who signs up finds
 * the product laid out the way the marketing pages described it.
 */
type FeatureItem = {
  /** Key stem under `landing.featureGroups.<group>.items`. */
  key: string
  /** Capture shown alongside this item on its group page, when one exists. */
  capture?: string
}

export type FeatureGroup = {
  /** Key stem under `landing.featureGroups`, the route segment, and the React key. */
  key: string
  items: readonly FeatureItem[]
  /** Renders muted, with a "coming soon" chip and no item list. */
  comingSoon?: boolean
}

export const FEATURE_GROUPS: readonly FeatureGroup[] = [
  {
    key: 'plan',
    items: [
      { key: 'overview', capture: SHOWCASE.overview },
      { key: 'plan', capture: SHOWCASE.plan },
    ],
  },
  {
    key: 'transactions',
    items: [
      { key: 'fixed', capture: SHOWCASE.fixed },
      { key: 'variable', capture: SHOWCASE.variable },
      { key: 'matching', capture: SHOWCASE.review },
    ],
  },
  { key: 'reports', items: [], comingSoon: true },
  {
    key: 'budget',
    items: [
      { key: 'income' },
      { key: 'savings', capture: SHOWCASE.people },
      { key: 'categories' },
      { key: 'paymentMethods' },
      { key: 'alerts' },
      { key: 'plaid' },
    ],
  },
] as const

/** Route for one group's page. Locale is explicit — this app prefixes every path. */
export function featureGroupHref(locale: string, groupKey: string): string {
  return `/${locale}/features/${groupKey}`
}

export function findFeatureGroup(key: string): FeatureGroup | undefined {
  return FEATURE_GROUPS.find((group) => group.key === key)
}

/**
 * Every `landing.*` key the features pages and nav dropdown will ask for.
 *
 * A key missing from any locale file is a build failure, and the group data
 * lives far enough from the message files that adding an item and forgetting
 * its copy is easy. The unit test walks this list against every locale.
 */
export function featureGroupTranslationKeys(): string[] {
  const keys: string[] = ['featureGroups.comingSoon']
  for (const group of FEATURE_GROUPS) {
    keys.push(`featureGroups.${group.key}.title`, `featureGroups.${group.key}.summary`)
    for (const item of group.items) {
      keys.push(
        `featureGroups.${group.key}.items.${item.key}.title`,
        `featureGroups.${group.key}.items.${item.key}.desc`,
      )
    }
  }
  return keys
}
