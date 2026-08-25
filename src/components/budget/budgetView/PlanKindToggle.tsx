'use client'

import { useTranslations } from 'next-intl'
import type { PlanKind } from './viewParams'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Box from '@mui/material/Box'

interface Props {
  value: PlanKind
  onChange: (kind: PlanKind) => void
}

/**
 * Switches the Plan view between what was planned and what was actually
 * spent. These were two peer tabs until issue #60; a segmented control is
 * what iOS has always used for the same pair, and folding them here is what
 * brings both clients down to four primary destinations.
 */
export function PlanKindToggle({ value, onChange }: Props) {
  const t = useTranslations('budget.view')

  return (
    <Box sx={{ mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        size="small"
        // `null` arrives when the active button is clicked again; keep the
        // current value rather than leaving the group with no selection.
        onChange={(_, next: PlanKind | null) => { if (next) onChange(next) }}
        aria-label={t('planKindLabel')}
      >
        <ToggleButton value="overview">{t('expenseOverview')}</ToggleButton>
        <ToggleButton value="plan">{t('expensePlan')}</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
