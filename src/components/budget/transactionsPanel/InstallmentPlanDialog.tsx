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
import {
  installmentAmount,
  installmentResidue,
  defaultFirstPaymentDate,
  installmentEndDate,
  installmentPaymentsFromEndDate,
  toDateInputValue,
  fromDateInputValue,
} from './installmentPlan'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import { expenseSummaryQueryKey } from '@/hooks/useExpenseSummary'

interface Props {
  tx: Transaction
  budgetPeriodId: string
  onClose: () => void
}

const MIN_PAYMENTS = 2
const MAX_PAYMENTS = 120

export function InstallmentPlanDialog({ tx, budgetPeriodId, onClose }: Props) {
  const t = useTranslations('budget.transactions.installments')
  const isMobile = useIsMobile()
  const { currency, locale } = useCurrency()
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()

  const purchaseDate = tx.date ? new Date(Number(tx.date.seconds) * 1000) : new Date()
  const total = txAmount(tx)

  const [payments, setPayments] = useState(3)
  const [firstPayment, setFirstPayment] = useState(() => defaultFirstPaymentDate(purchaseDate))
  // Held as its own state rather than derived, so an explicit override survives
  // — the server accepts one, and a user paying off early shouldn't have to
  // fake the payment count to express it.
  const [endDate, setEndDate] = useState(() => installmentEndDate(defaultFirstPaymentDate(purchaseDate), 3))

  const perPayment = installmentAmount(total, payments)
  const residue = installmentResidue(total, payments)

  function applyPayments(next: number) {
    const clamped = Math.min(Math.max(next, MIN_PAYMENTS), MAX_PAYMENTS)
    setPayments(clamped)
    setEndDate(installmentEndDate(firstPayment, clamped))
  }

  function applyFirstPayment(next: Date) {
    setFirstPayment(next)
    setEndDate(installmentEndDate(next, payments))
  }

  // Editing the end date moves the payment count, which moves the per-payment
  // amount — the same bidirectional link the Add/Edit Fixed Expense forms use.
  function applyEndDate(next: Date) {
    setEndDate(next)
    setPayments(Math.min(Math.max(installmentPaymentsFromEndDate(firstPayment, next), MIN_PAYMENTS), MAX_PAYMENTS))
  }

  const mutation = useMutation({
    mutationFn: () => client.createInstallmentPlan({
      transactionId: tx.id,
      budgetPeriodId,
      firstPaymentDate: Timestamp.fromDate(firstPayment),
      totalPayments: payments,
      endDate: Timestamp.fromDate(endDate),
    }),
    onSuccess: () => {
      logger.info('transaction.installmentPlan.create', { transactionId: tx.id, payments })
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] })
      queryClient.invalidateQueries({ queryKey: expenseSummaryQueryKey(budgetPeriodId) })
      onClose()
    },
    onError: (err) => {
      logger.error('transaction.installmentPlan.create', { transactionId: tx.id, error: String(err) })
      showError(err instanceof Error ? err.message : t('error'))
    },
  })

  return (
    <Dialog open fullScreen={isMobile} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('explainer', { name: tx.name, amount: formatMoneyFromNumber(total, currency, locale) })}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('payments')}
            type="number"
            size="small"
            value={payments}
            onChange={(e) => applyPayments(Number(e.target.value))}
            inputProps={{ min: MIN_PAYMENTS, max: MAX_PAYMENTS }}
            fullWidth
          />
          <TextField
            label={t('firstPayment')}
            type="date"
            size="small"
            value={toDateInputValue(firstPayment)}
            onChange={(e) => {
              const d = fromDateInputValue(e.target.value)
              if (d) applyFirstPayment(d)
            }}
            InputLabelProps={{ shrink: true }}
            helperText={t('firstPaymentHelp')}
            fullWidth
          />
          <TextField
            label={t('endDate')}
            type="date"
            size="small"
            value={toDateInputValue(endDate)}
            onChange={(e) => {
              const d = fromDateInputValue(e.target.value)
              if (d) applyEndDate(d)
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {t('preview', {
                amount: formatMoneyFromNumber(perPayment, currency, locale),
                count: payments,
              })}
            </Typography>
            {residue !== 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('residue', {
                  total: formatMoneyFromNumber(perPayment * payments, currency, locale),
                })}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ py: 0 }}>{t('willExclude')}</Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <LoadingButton
          variant="contained"
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {t('confirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
