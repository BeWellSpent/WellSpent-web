'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import PieChartIcon from '@mui/icons-material/PieChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'
import { type ChartMode, chartTypeToMode, modeToChartType } from '@/hooks/useChartPreference'

interface Props {
  budgetProfileId: string
}

/**
 * Per-person settings for this budget. Deliberately not role-gated: these are
 * the caller's own view preferences, so a Viewer changes theirs like anyone
 * else. The RPC writes whichever row belongs to the caller and takes no person
 * id, so there is nothing here that could edit someone else's.
 */
export function PreferencesPanel({ budgetProfileId }: Props) {
  const t = useTranslations('budget.preferences')
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const { person, isLoading } = useMyBudgetPerson(budgetProfileId)

  // Seeded from the server row, then held locally so the toggle responds
  // immediately rather than waiting on the refetch.
  const [plan, setPlan] = useState<ChartMode | null>(null)
  const [overview, setOverview] = useState<ChartMode | null>(null)

  const planValue = plan ?? chartTypeToMode(person?.planChartType)
  const overviewValue = overview ?? chartTypeToMode(person?.overviewChartType)

  const { mutateAsync: save, isPending } = useMutation({
    mutationFn: (next: { plan: ChartMode; overview: ChartMode }) =>
      client.updateMyBudgetPreferences({
        budgetProfileId,
        planChartType: modeToChartType(next.plan),
        overviewChartType: modeToChartType(next.overview),
      }),
  })

  async function update(next: { plan: ChartMode; overview: ChartMode }) {
    const previous = { plan: planValue, overview: overviewValue }
    setPlan(next.plan)
    setOverview(next.overview)
    try {
      await save(next)
      await queryClient.invalidateQueries({ queryKey: ['budget-people', budgetProfileId] })
      logger.info('budget.preferences.update', { budgetProfileId, ...next })
    } catch (err) {
      // Put the toggle back where it was, so the UI never claims a preference
      // the server didn't accept.
      setPlan(previous.plan)
      setOverview(previous.overview)
      showError(err instanceof Error ? err.message : t('saveFailed'))
    }
  }

  if (isLoading) return null

  if (!person) {
    // An owner viewing their own budget always has a row; this is the
    // not-a-linked-member case, where there's nothing to store against.
    return (
      <Typography variant="body2" color="text.secondary">
        {t('unavailable')}
      </Typography>
    )
  }

  return (
    <Stack spacing={3} sx={{ px: { xs: 1, sm: 0 } }}>
      <Typography variant="body2" color="text.secondary">
        {t('description')}
      </Typography>

      <ChartChoice
        label={t('planChart')}
        value={planValue}
        disabled={isPending}
        onChange={(mode) => update({ plan: mode, overview: overviewValue })}
        pieLabel={t('pie')}
        barLabel={t('bar')}
        identifier="planChartPreference"
      />

      <ChartChoice
        label={t('overviewChart')}
        value={overviewValue}
        disabled={isPending}
        onChange={(mode) => update({ plan: planValue, overview: mode })}
        pieLabel={t('pie')}
        barLabel={t('bar')}
        identifier="overviewChartPreference"
      />
    </Stack>
  )
}

function ChartChoice({
  label, value, disabled, onChange, pieLabel, barLabel, identifier,
}: {
  label: string
  value: ChartMode
  disabled: boolean
  onChange: (mode: ChartMode) => void
  pieLabel: string
  barLabel: string
  identifier: string
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        disabled={disabled}
        // Ignores a null value: clicking the already-selected button
        // deselects in MUI, which would leave no chart chosen at all.
        onChange={(_, next) => next && onChange(next as ChartMode)}
        data-testid={identifier}
      >
        <ToggleButton value="pie">
          <PieChartIcon fontSize="small" sx={{ mr: 0.5 }} />
          {pieLabel}
        </ToggleButton>
        <ToggleButton value="bar">
          <BarChartIcon fontSize="small" sx={{ mr: 0.5 }} />
          {barLabel}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
