'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useCurrency } from '@/hooks/useCurrency'
import { formatMoneyFromNumber } from '@/lib/format'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { txAmount, txPlannedAmount, formatVariableAmount, exactNanos } from './helpers'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { logger } from '@/lib/logger'

interface Props {
  open: boolean
  onClose: () => void
  matchedTransaction: Transaction | null
  budgetProfileId: string
  budgetPeriodId: string
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
}

// Fixed-row counterpart to MarkForReviewDialog — multi-select instead of one.
export function MatchTransactionsDialog({
  open, onClose, matchedTransaction, budgetProfileId, budgetPeriodId,
  categoryMap, methodMap, personMap,
}: Props) {
  const t = useTranslations('budget.matchTransactions')
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const { currency, locale } = useCurrency()
  const formatMoney = (v: number) => formatMoneyFromNumber(v, currency, locale)
  const isMobile = useIsMobile()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const { data: variableTxData, isLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 2],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 2 }),
    enabled: open,
  })

  const { mutateAsync: doMatch, isPending } = useMutation({
    mutationFn: () =>
      Promise.all(
        Array.from(selectedIds).map((transactionId) =>
          client.markTransactionForReview({
            transactionId,
            matchedTransactionId: matchedTransaction!.id,
            budgetProfileId,
          }),
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-reviews', budgetProfileId] })
      logger.info('review.matchTransactions', { matchedTransactionId: matchedTransaction?.id, count: selectedIds.size })
      handleClose()
    },
  })

  async function handleConfirm() {
    try {
      await doMatch()
    } catch (err) {
      showError(err)
    }
  }

  function handleClose() {
    setSelectedIds(new Set())
    setFilter('')
    onClose()
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filterLower = filter.toLowerCase()
  const candidates = (variableTxData?.transactions ?? []).filter(
    (tx) => !filterLower || tx.name.toLowerCase().includes(filterLower),
  )
  const selectedCandidates = candidates.filter((tx) => selectedIds.has(tx.id))
  const selectedTotal = selectedCandidates.reduce((sum, tx) => sum + txAmount(tx), 0)
  // Must sum to the full planned amount before confirming is allowed.
  const plannedExact = matchedTransaction ? exactNanos(matchedTransaction.plannedAmount) : 0n
  const selectedExact = selectedCandidates.reduce((sum, tx) => sum + exactNanos(tx.amount), 0n)
  const matchesExactly = selectedIds.size > 0 && selectedExact === plannedExact

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={isMobile} maxWidth="sm" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {matchedTransaction && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" gutterBottom>{matchedTransaction.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('plannedAmount', { amount: formatMoney(txPlannedAmount(matchedTransaction)) })}
            </Typography>
          </Box>
        )}

        <Divider />

        <Box sx={{ px: 2, py: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('filterPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : candidates.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filter ? t('noResults') : t('noVariable')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {candidates.map((tx) => {
              const { text: amtText, color: amtColor } = formatVariableAmount(txAmount(tx), currency, locale)
              return (
                <ListItem key={tx.id} disablePadding>
                  <ListItemButton onClick={() => toggle(tx.id)} dense>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={selectedIds.has(tx.id)} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText
                      primary={tx.name}
                      secondary={<Typography variant="body2" component="span" color={amtColor ?? 'inherit'}>{amtText}</Typography>}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="body2" color={matchesExactly ? 'success.main' : 'text.secondary'}>
          {selectedIds.size > 0 && (
            matchesExactly
              ? t('selectedTotal', { amount: formatMoney(selectedTotal) })
              : t('totalMustMatch', { selected: formatMoney(selectedTotal), planned: formatMoney(txPlannedAmount(matchedTransaction!)) })
          )}
        </Typography>
        <Box>
          <Button onClick={handleClose} disabled={isPending}>{t('cancel')}</Button>
          <LoadingButton
            onClick={handleConfirm}
            variant="contained"
            disabled={!matchesExactly}
            loading={isPending}
          >
            {t('confirm')}
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
