'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { Transaction, FixedExpense } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { logger } from '@/lib/logger'

function fmtMoney(fe: FixedExpense): string {
  const n = Number(fe.plannedAmount?.units ?? 0n) + (fe.plannedAmount?.nanos ?? 0) / 1e9
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface Props {
  open: boolean
  onClose: () => void
  transaction: Transaction | null
  budgetProfileId: string
  budgetPeriodId: string
}

export function MarkForReviewDialog({ open, onClose, transaction, budgetProfileId, budgetPeriodId }: Props) {
  const t = useTranslations('budget.markForReview')
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: feData, isLoading } = useQuery({
    queryKey: ['fixed-expenses', budgetProfileId],
    queryFn: () => client.listFixedExpenses({ budgetProfileId }),
    enabled: open,
  })

  const { mutateAsync: doMark, isPending } = useMutation({
    mutationFn: () =>
      client.markTransactionForReview({
        transactionId: transaction!.id,
        fixedExpenseId: selectedId!,
        budgetProfileId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-reviews', budgetProfileId] })
      logger.info('review.markForReview', { transactionId: transaction?.id, fixedExpenseId: selectedId })
      onClose()
    },
  })

  async function handleConfirm() {
    try {
      await doMark()
    } catch (err) {
      showError(err)
    }
  }

  function handleClose() {
    setSelectedId(null)
    onClose()
  }

  const fixedExpenses = feData?.expenses ?? []

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={isMobile} maxWidth="sm" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {transaction && (
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('flagging')}: <strong>{transaction.name}</strong>
            </Typography>
          </Box>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : fixedExpenses.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">{t('noFixed')}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {fixedExpenses.map((fe) => (
              <ListItem key={fe.id} disablePadding>
                <ListItemButton
                  selected={selectedId === fe.id}
                  onClick={() => setSelectedId(fe.id)}
                >
                  <ListItemText
                    primary={fe.name}
                    secondary={fmtMoney(fe)}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>{t('cancel')}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedId || isPending}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
