'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'

interface Props {
  budgetProfileId: string
}

/**
 * Budget-wide carryover setting, deliberately a separate component from
 * `PreferencesPanel` even though both render in the same drawer: that one holds
 * the caller's own view preferences and is intentionally not role-gated, while
 * this changes what every member's next period will contain and is Admin only.
 *
 * The helper text spells the rule out rather than saying "carry my balance
 * forward". Nothing else in the app creates transactions on the user's behalf,
 * so a switch that silently does needs to say what it will produce.
 */
export function CarryoverSettingsPanel({ budgetProfileId }: Props) {
  const t = useTranslations('budget.carryover')
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const isAdmin = useBudgetRole(budgetProfileId) === BudgetRole.ADMIN

  const { data: profileData } = useQuery({
    queryKey: ['budget-profile', budgetProfileId],
    queryFn: () => client.getBudgetProfile({ id: budgetProfileId }),
  })

  // Held locally once touched so the switch answers immediately instead of
  // waiting on the refetch, same shape as PreferencesPanel's chart toggles.
  const [pending, setPending] = useState<boolean | null>(null)
  const enabled = pending ?? profileData?.profile?.carryoverEnabled ?? false

  const { mutateAsync: save, isPending } = useMutation({
    mutationFn: (next: boolean) => client.setBudgetCarryoverEnabled({ budgetProfileId, enabled: next }),
  })

  async function update(next: boolean) {
    const previous = enabled
    setPending(next)
    try {
      await save(next)
      await queryClient.invalidateQueries({ queryKey: ['budget-profile', budgetProfileId] })
      logger.info('budget.carryover.update', { budgetProfileId, enabled: next })
    } catch (err) {
      // Put the switch back, so the UI never claims a setting the server
      // didn't accept.
      setPending(previous)
      showError(err instanceof Error ? err.message : t('saveFailed'))
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="subtitle2">{t('title')}</Typography>
        <Switch
          checked={enabled}
          disabled={!isAdmin || isPending}
          onChange={(e) => update(e.target.checked)}
          inputProps={{ 'aria-label': t('title') }}
          data-testid="carryoverToggle"
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {t('description')}
      </Typography>
      {!isAdmin && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {t('adminOnly')}
        </Typography>
      )}
    </Box>
  )
}
