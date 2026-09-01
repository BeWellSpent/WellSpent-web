'use client'

import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

interface Props {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
}

/**
 * Big, centered amount entry — the first thing an Add/Edit form shows now,
 * replacing the small labeled field that used to sit further down. Shared so
 * every add/edit form (transactions, fixed expenses) looks identical;
 * `autoFocus` is the only difference callers set between them — on when
 * adding, off when editing. Mirrors iOS's `AmountHeroField.swift`.
 */
export function AmountHeroField({ value, onChange, autoFocus = false, disabled = false }: Props) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <TextField
        variant="standard"
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder="0.00"
        aria-label="Amount"
        InputProps={{ disableUnderline: true }}
        inputProps={{
          min: 0,
          step: '0.01',
          inputMode: 'decimal',
          style: { textAlign: 'center' },
        }}
        sx={{
          width: '100%',
          '& .MuiInputBase-input': { fontSize: { xs: '2.5rem', sm: '3rem' }, fontWeight: 700 },
        }}
      />
    </Box>
  )
}
