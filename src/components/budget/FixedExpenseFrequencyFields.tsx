'use client'

import { ScrollNumberPicker } from '@/components/ui/ScrollNumberPicker'
import { FREQUENCY_COUNT_RANGE, type FrequencyUnitUI } from './fixedExpenseFrequency'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface Props {
  unit: FrequencyUnitUI
  count: number
  onUnitChange: (unit: FrequencyUnitUI) => void
  onCountChange: (count: number) => void
}

/** "Repeats every" unit + count picker, shared by every fixed-expense schedule form. */
export function FixedExpenseFrequencyFields({ unit, count, onUnitChange, onCountChange }: Props) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-start">
      <TextField
        select
        label="Repeats every"
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as FrequencyUnitUI)}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="week">Week(s)</MenuItem>
        <MenuItem value="month">Month(s)</MenuItem>
        <MenuItem value="year">Year(s)</MenuItem>
      </TextField>
      <Stack spacing={0.5} alignItems="center">
        <ScrollNumberPicker
          value={count}
          onChange={onCountChange}
          min={FREQUENCY_COUNT_RANGE[unit].min}
          max={FREQUENCY_COUNT_RANGE[unit].max}
          aria-label="Repeat count"
        />
        <Typography variant="caption" color="text.secondary">How often this expense is due</Typography>
      </Stack>
    </Stack>
  )
}
