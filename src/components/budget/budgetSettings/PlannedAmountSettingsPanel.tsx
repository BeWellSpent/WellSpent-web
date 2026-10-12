'use client'

import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { isEnabled } from '@/lib/config/features'
import { BudgetSettingToggle } from './BudgetSettingToggle'

/**
 * Whether paying a bill at a different amount re-plans it for future periods.
 *
 * Defaults to true, which is what every path did unconditionally before the
 * setting existed. See docs/features/planned-amount-follows-paid.md.
 */
export function PlannedAmountSettingsPanel({ budgetProfileId }: { budgetProfileId: string }) {
  const t = useTranslations('budget.plannedAmountSync')
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  async function save(enabled: boolean) {
    if (isEnabled('csharpBudget')) {
      return unwrap(await dotnetClient.PUT('/rest/v1/budgets/{id}/auto-update-planned-amount', {
        params: { path: { id: budgetProfileId } },
        body: { enabled },
      }))
    }
    return client.setBudgetAutoUpdatePlannedAmount({ budgetProfileId, enabled })
  }

  return (
    <BudgetSettingToggle
      budgetProfileId={budgetProfileId}
      title={t('title')}
      description={t('description')}
      adminOnlyLabel={t('adminOnly')}
      saveFailedLabel={t('saveFailed')}
      value={(profile) => profile?.autoUpdatePlannedAmount ?? true}
      save={save}
      event="budget.plannedAmountSync.update"
      testId="plannedAmountSyncToggle"
    />
  )
}
