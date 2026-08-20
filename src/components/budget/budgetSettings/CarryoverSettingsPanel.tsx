'use client'

import { useTranslations } from 'next-intl'
import { BudgetSettingToggle } from './BudgetSettingToggle'

/**
 * Whether closing a period carries its ending balance into the next one.
 * See docs/features/carryover-balance.md.
 */
export function CarryoverSettingsPanel({ budgetProfileId }: { budgetProfileId: string }) {
  const t = useTranslations('budget.carryover')
  return (
    <BudgetSettingToggle
      budgetProfileId={budgetProfileId}
      title={t('title')}
      description={t('description')}
      adminOnlyLabel={t('adminOnly')}
      saveFailedLabel={t('saveFailed')}
      value={(profile) => profile?.carryoverEnabled ?? false}
      save={(client, enabled) => client.setBudgetCarryoverEnabled({ budgetProfileId, enabled })}
      event="budget.carryover.update"
      testId="carryoverToggle"
    />
  )
}
