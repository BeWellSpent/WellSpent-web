'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'

interface Props {
  budgetProfileId: string
  title: string
  description: string
  adminOnlyLabel: string
  saveFailedLabel: string
  /** Reads the current value off the profile. */
  value: (profile: BudgetProfile | undefined) => boolean
  /** Calls the RPC that persists it. */
  save: (client: ReturnType<typeof useClient<typeof BudgetService>>, enabled: boolean) => Promise<unknown>
  /** Logger event name, e.g. `budget.carryover.update`. */
  event: string
  testId: string
}

/**
 * A budget-wide, Admin-only boolean setting.
 *
 * Extracted rather than copied: carryover and auto-update-planned-amount are
 * the same component down to the optimistic-update-and-roll-back behaviour,
 * and a third will be too. Deliberately separate from `PreferencesPanel`, which
 * holds the caller's *own* view preferences and is intentionally not
 * role-gated — these change what every member of the budget gets.
 */
export function BudgetSettingToggle({
  budgetProfileId, title, description, adminOnlyLabel, saveFailedLabel,
  value, save, event, testId,
}: Props) {
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const isAdmin = useBudgetRole(budgetProfileId) === BudgetRole.ADMIN

  const { data } = useQuery({
    queryKey: ['budget-profile', budgetProfileId],
    queryFn: () => client.getBudgetProfile({ id: budgetProfileId }),
  })

  // Held locally once touched so the switch answers immediately rather than
  // waiting on the refetch.
  const [pending, setPending] = useState<boolean | null>(null)
  const enabled = pending ?? value(data?.profile)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (next: boolean) => save(client, next),
  })

  async function update(next: boolean) {
    const previous = enabled
    setPending(next)
    try {
      await mutateAsync(next)
      await queryClient.invalidateQueries({ queryKey: ['budget-profile', budgetProfileId] })
      logger.info(event, { budgetProfileId, enabled: next })
    } catch (err) {
      // Put the switch back, so the UI never claims a setting the server
      // didn't accept.
      setPending(previous)
      showError(err instanceof Error ? err.message : saveFailedLabel)
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="subtitle2">{title}</Typography>
        <Switch
          checked={enabled}
          disabled={!isAdmin || isPending}
          onChange={(e) => update(e.target.checked)}
          inputProps={{ 'aria-label': title }}
          data-testid={testId}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {description}
      </Typography>
      {!isAdmin && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {adminOnlyLabel}
        </Typography>
      )}
    </Box>
  )
}
