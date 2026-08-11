/**
 * The feature groups shown as accordions in the Features section and listed in
 * the nav's Features dropdown.
 *
 * Both read from this one array so the menu and the page can't drift apart —
 * adding a group here adds it in both places.
 *
 * Order mirrors the app's own budget-view tabs (Plan, Transactions, Reports)
 * followed by the budget-management panels, so a visitor who signs up finds the
 * product laid out the way the marketing page described it.
 */
export type FeatureGroup = {
  /** Key stem under `landing.featureGroups`, and the React key. */
  key: string
  /** Anchor id, so the nav dropdown can scroll straight to this group. */
  id: string
  /** Key stems under `landing.featureGroups.<key>.items`. */
  items: readonly string[]
  /** Renders muted, with a "coming soon" chip and no item list. */
  comingSoon?: boolean
}

export const FEATURE_GROUPS: readonly FeatureGroup[] = [
  { key: 'plan', id: 'features-plan', items: ['overview', 'plan'] },
  { key: 'transactions', id: 'features-transactions', items: ['fixed', 'variable', 'matching'] },
  { key: 'reports', id: 'features-reports', items: [], comingSoon: true },
  {
    key: 'budget',
    id: 'features-budget',
    items: ['income', 'savings', 'categories', 'paymentMethods', 'alerts', 'plaid'],
  },
] as const

/**
 * Every `landing.*` key the Features section and nav dropdown will ask for.
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
        `featureGroups.${group.key}.items.${item}.title`,
        `featureGroups.${group.key}.items.${item}.desc`,
      )
    }
  }
  return keys
}
