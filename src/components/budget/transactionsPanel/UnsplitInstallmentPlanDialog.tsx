'use client'

import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import Typography from '@mui/material/Typography'
import { expenseSummaryQueryKey } from '@/hooks/useExpenseSummary'

interface Props {
  tx: Transaction
  budgetPeriodId: string
  onClose: () => void
}

/**
 * Confirms undoing an installment split. The backend refuses once any payment
 * has been marked paid, so the error path here is a real, expected outcome
 * rather than a defensive catch — it's surfaced verbatim.
 */
export function UnsplitInstallmentPlanDialog({ tx, budgetPeriodId, onClose }: Props) {
  const t = useTranslations('budget.transactions.installments')
  const isMobile = useIsMobile()
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()

  const mutation = useMutation({
    mutationFn: () => client.deleteInstallmentPlan({ transactionId: tx.id, budgetPeriodId }),
    onSuccess: () => {
      logger.info('transaction.installmentPlan.delete', { transactionId: tx.id })
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] })
      queryClient.invalidateQueries({ queryKey: expenseSummaryQueryKey(budgetPeriodId) })
      onClose()
    },
    onError: (err) => {
      logger.error('transaction.installmentPlan.delete', { transactionId: tx.id, error: String(err) })
      showError(err instanceof Error ? err.message : t('unsplitError'))
    },
  })

  return (
    <Dialog open fullScreen={isMobile} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('unsplitTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{t('unsplitBody', { name: tx.name })}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <LoadingButton color="warning" variant="contained" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          {t('unsplitConfirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
