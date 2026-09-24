'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Timestamp } from '@bufbuild/protobuf'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useCurrency } from '@/hooks/useCurrency'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatMoneyFromNumber } from '@/lib/format'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { txAmount } from './helpers'
import { toDateInputValue, fromDateInputValue } from './installmentPlan'
import { FixedExpenseFrequencyFields } from '@/components/budget/FixedExpenseFrequencyFields'
import { type FrequencyUnitUI, frequencyFieldsFor } from '@/components/budget/fixedExpenseFrequency'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { expenseSummaryQueryKey } from '@/hooks/useExpenseSummary'

interface Props {
  tx: Transaction
  budgetPeriodId: string
  onClose: () => void
}

export function CreateFixedFromTransactionDialog({ tx, budgetPeriodId, onClose }: Props) {
  const t = useTranslations('budget.transactions.fixedFromTransaction')
  const isMobile = useIsMobile()
  const { currency, locale } = useCurrency()
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()

  const purchaseDate = tx.date ? new Date(Number(tx.date.seconds) * 1000) : new Date()
  const amount = txAmount(tx)

  const [name, setName] = useState(tx.name)
  const [anchorDate, setAnchorDate] = useState(purchaseDate)
  const [unit, setUnit] = useState<FrequencyUnitUI>('month')
  const [count, setCount] = useState(1)

  const mutation = useMutation({
    mutationFn: () => {
      const dayOfWeek = anchorDate.getUTCDay() || 7
      return client.createFixedExpenseFromTransaction({
        transactionId: tx.id,
        budgetPeriodId,
        name: name.trim(),
        anchorDate: Timestamp.fromDate(anchorDate),
        ...frequencyFieldsFor(unit, count, dayOfWeek),
      })
    },
    onSuccess: () => {
      logger.info('transaction.fixedFromTransaction.create', { transactionId: tx.id })
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] })
      queryClient.invalidateQueries({ queryKey: expenseSummaryQueryKey(budgetPeriodId) })
      onClose()
    },
    onError: (err) => {
      logger.error('transaction.fixedFromTransaction.create', { transactionId: tx.id, error: String(err) })
      showError(err instanceof Error ? err.message : t('error'))
    },
  })

  return (
    <Dialog open fullScreen={isMobile} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('explainer', { name: tx.name, amount: formatMoneyFromNumber(amount, currency, locale) })}
        </Typography>

        <Stack spacing={2}>
          <TextField label={t('name')} value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField
            label={t('startDate')}
            type="date"
            size="small"
            value={toDateInputValue(anchorDate)}
            onChange={(e) => {
              const d = fromDateInputValue(e.target.value)
              if (d) setAnchorDate(d)
            }}
            InputLabelProps={{ shrink: true }}
            helperText={t('startDateHelp')}
            fullWidth
          />
          <FixedExpenseFrequencyFields unit={unit} count={count} onUnitChange={setUnit} onCountChange={setCount} />
          <Alert severity="info" sx={{ py: 0 }}>{t('willMatch')}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <LoadingButton
          variant="contained"
          loading={mutation.isPending}
          disabled={!name.trim()}
          onClick={() => mutation.mutate()}
        >
          {t('confirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
