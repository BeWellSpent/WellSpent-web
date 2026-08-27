'use client'

import { useTranslations } from 'next-intl'
import { PaymentMethodSelect } from '@/components/budget/PaymentMethodSelect'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import FormHelperText from '@mui/material/FormHelperText'

interface Props {
  budgetProfileId: string
  name: string
  onNameChange: (value: string) => void
  amount: string
  onAmountChange: (value: string) => void
  paymentMethodId: string
  onPaymentMethodChange: (value: string) => void
  paymentDays: number[]
  onToggleDay: (day: number) => void
  daysInMonth: number
}

/**
 * The fields describing one savings source, with no submit button and no
 * opinion about whether it sits in a dialog or a wizard step.
 *
 * Both callers render these identically on purpose — a savings source created
 * during setup and one created later are the same thing, and the number of
 * payment days a user is allowed to pick should not depend on which screen
 * they happened to be on.
 */
export function SavingsSourceFields({
  budgetProfileId,
  name, onNameChange,
  amount, onAmountChange,
  paymentMethodId, onPaymentMethodChange,
  paymentDays, onToggleDay,
  daysInMonth,
}: Props) {
  const t = useTranslations('budget.savings.addDialog')
  const tFreq = useTranslations('budget.savings.freq')

  // The count *is* the frequency, so naming it back to the user is the only
  // feedback that explains why 3 days is rejected.
  const frequencyLabel =
    paymentDays.length === 1 ? tFreq('monthly')
    : paymentDays.length === 2 ? tFreq('biWeekly')
    : paymentDays.length === 4 ? tFreq('weekly')
    : ''

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField
        label={t('name')}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        fullWidth
        placeholder={t('namePlaceholder')}
      />
      <TextField
        label={t('amount')}
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        fullWidth
        inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
      />
      <PaymentMethodSelect
        budgetProfileId={budgetProfileId}
        value={paymentMethodId}
        onChange={onPaymentMethodChange}
        label={t('paymentMethod')}
        required
      />
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('paymentDays')}
          {frequencyLabel && (
            <Box component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 500 }}>
              — {frequencyLabel}
            </Box>
          )}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <Chip
              key={day}
              label={day}
              size="small"
              color={paymentDays.includes(day) ? 'primary' : 'default'}
              onClick={() => onToggleDay(day)}
              sx={{ width: 36, cursor: 'pointer' }}
            />
          ))}
        </Box>
        <FormHelperText>{t('dayHint')}</FormHelperText>
      </Box>
    </Stack>
  )
}
