'use client'

import { useTranslations } from 'next-intl'
import { BudgetSettingToggle } from './BudgetSettingToggle'

/**
 * Whether paying a bill at a different amount re-plans it for future periods.
 *
 * Defaults to true, which is what every path did unconditionally before the
 * setting existed. See docs/features/planned-amount-follows-paid.md.
 */
export function PlannedAmountSettingsPanel({ budgetProfileId }: { budgetProfileId: string }) {
  const t = useTranslations('budget.plannedAmountSync')
  return (
    <BudgetSettingToggle
      budgetProfileId={budgetProfileId}
      title={t('title')}
      description={t('description')}
      adminOnlyLabel={t('adminOnly')}
      saveFailedLabel={t('saveFailed')}
      value={(profile) => profile?.autoUpdatePlannedAmount ?? true}
      save={(client, enabled) => client.setBudgetAutoUpdatePlannedAmount({ budgetProfileId, enabled })}
      event="budget.plannedAmountSync.update"
      testId="plannedAmountSyncToggle"
    />
  )
}
