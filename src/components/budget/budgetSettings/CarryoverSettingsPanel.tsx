'use client'

import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { isEnabled } from '@/lib/config/features'
import { BudgetSettingToggle } from './BudgetSettingToggle'

/**
 * Whether closing a period carries its ending balance into the next one.
 * See docs/features/carryover-balance.md.
 */
export function CarryoverSettingsPanel({ budgetProfileId }: { budgetProfileId: string }) {
  const t = useTranslations('budget.carryover')
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  async function save(enabled: boolean) {
    if (isEnabled('csharpBudget')) {
      return unwrap(await dotnetClient.PUT('/rest/v1/budgets/{id}/carryover-enabled', {
        params: { path: { id: budgetProfileId } },
        body: { enabled },
      }))
    }
    return client.setBudgetCarryoverEnabled({ budgetProfileId, enabled })
  }

  return (
    <BudgetSettingToggle
      budgetProfileId={budgetProfileId}
      title={t('title')}
      description={t('description')}
      adminOnlyLabel={t('adminOnly')}
      saveFailedLabel={t('saveFailed')}
      value={(profile) => profile?.carryoverEnabled ?? false}
      save={save}
      event="budget.carryover.update"
      testId="carryoverToggle"
    />
  )
}
