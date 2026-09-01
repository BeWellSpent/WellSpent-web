'use client'

import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { PaymentMethodSelect } from '@/components/budget/PaymentMethodSelect'
import { AmountHeroField } from '@/components/budget/modals/AmountHeroField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useCategoryName, useSortedCategories } from '@/hooks/useCategoryName'

type Flow = 'spent' | 'received'

interface Props {
  budgetProfileId: string
  transaction: Transaction
  /** True when viewing an archived (past) period. */
  isArchivedPeriod?: boolean
  onClose: () => void
  onDone: () => void
}

function moneyToString(units: bigint, nanos: number): string {
  const total = Math.abs(Number(units) + nanos / 1e9)
  return total.toFixed(2)
}

function amountToFlow(units: bigint, nanos: number): Flow {
  return Number(units) + nanos / 1e9 < 0 ? 'received' : 'spent'
}

function timestampToDateString(ts: { seconds: bigint } | undefined): string {
  const d = ts && ts.seconds !== 0n ? new Date(Number(ts.seconds) * 1000) : new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function timestampToDayOfMonth(ts: { seconds: bigint } | undefined): number {
  if (!ts || ts.seconds === 0n) return new Date().getUTCDate()
  return new Date(Number(ts.seconds) * 1000).getUTCDate()
}

function dateStringToTimestamp(str: string): { seconds: bigint; nanos: number } {
  const [year, month, day] = str.split('-').map(Number)
  return { seconds: BigInt(Math.floor(Date.UTC(year, month - 1, day) / 1000)), nanos: 0 }
}

function dayOfMonthToTimestamp(day: number): { seconds: bigint; nanos: number } {
  const now = new Date()
  return { seconds: BigInt(Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day) / 1000)), nanos: 0 }
}

export function EditTransactionModal({ budgetProfileId, transaction, isArchivedPeriod = false, onClose, onDone }: Props) {
  const t = useTranslations('budget.transactions')
  const categoryName = useCategoryName()
  const { showError } = useSnackbar()
  const fullScreen = useIsMobile()
  const client = useClient(BudgetService)

  // Once a period has archived, or for any Plaid-imported transaction, the
  // financial record itself is frozen server-side — only the category can
  // still change (see the backend's assertOnlyCategoryChanged). Locked
  // fields are disabled rather than hidden so it's clear what happened and
  // why nothing else can be edited here.
  const isLocked = isArchivedPeriod || transaction.isPlaidImported

  const [name, setName] = useState(transaction.name)
  const [amount, setAmount] = useState(() =>
    moneyToString(transaction.amount?.units ?? 0n, transaction.amount?.nanos ?? 0)
  )
  const [flow, setFlow] = useState<Flow>(() =>
    amountToFlow(transaction.amount?.units ?? 0n, transaction.amount?.nanos ?? 0)
  )
  const [typeId, setTypeId] = useState(transaction.transactionTypeId)
  const [date, setDate] = useState(() => timestampToDateString(transaction.date))
  const [dayOfMonth, setDayOfMonth] = useState(() => timestampToDayOfMonth(transaction.date))
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [paymentMethodId, setPaymentMethodId] = useState(transaction.paymentMethodId)

  const isFixed = typeId === 1

  useEffect(() => {
    setName(transaction.name)
    const units = transaction.amount?.units ?? 0n
    const nanos = transaction.amount?.nanos ?? 0
    setAmount(moneyToString(units, nanos))
    setFlow(amountToFlow(units, nanos))
    setTypeId(transaction.transactionTypeId)
    setDate(timestampToDateString(transaction.date))
    setDayOfMonth(timestampToDayOfMonth(transaction.date))
    setCategoryId(transaction.categoryId)
    setPaymentMethodId(transaction.paymentMethodId)
  }, [transaction])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', budgetProfileId],
    queryFn: () => client.listCategories({ budgetProfileId }),
  })
  const sortedCategories = useSortedCategories(categoriesData?.categories ?? [])

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      plannedAmount: { units: bigint; nanos: number }
      date: { seconds: bigint; nanos: number }
      categoryId: number
      paymentMethodId: string
      transactionTypeId: number
      transactionFrequencyId: number
    }) => client.updateTransaction({ id: transaction.id, ...vars }),
  })

  const isDateValid = isFixed ? dayOfMonth >= 1 && dayOfMonth <= 31 : !!date
  const canSave = isLocked || (!!name.trim() && !!amount && !!paymentMethodId && isDateValid)

  async function handleSave() {
    if (!canSave) return
    // Locked (archived period or Plaid-linked): send every field back
    // exactly as originally recorded except category — the backend rejects
    // an update that changes anything else in that case. Reconstructing from
    // (unchanged, disabled) form state risks a spurious mismatch from string
    // round-tripping, so this reads off the transaction record directly
    // instead — but the `transaction` prop can itself be stale (e.g. a
    // background Plaid sync updated `amount` after this list was fetched but
    // before the user opened this modal), which would fail the same
    // category-only check for a field the user never touched. Refetching
    // immediately before submit closes that race.
    if (isLocked) {
      try {
        const fresh = await client.listTransactions({ budgetPeriodId: transaction.budgetPeriodId })
        const current = fresh.transactions.find((t) => t.id === transaction.id) ?? transaction
        await mutateAsync({
          name: current.name,
          amount: current.amount ?? { units: 0n, nanos: 0 },
          plannedAmount: current.plannedAmount ?? { units: 0n, nanos: 0 },
          date: current.date ?? { seconds: 0n, nanos: 0 },
          categoryId,
          paymentMethodId: current.paymentMethodId,
          transactionTypeId: current.transactionTypeId,
          transactionFrequencyId: current.transactionFrequencyId,
        })
        logger.info('transaction.update.categoryOnly', { budgetProfileId, id: transaction.id, categoryId })
        onDone()
      } catch (err) {
        showError(err)
      }
      return
    }

    const rawAmt = parseFloat(amount)
    // Fixed expenses are always outgoing — no flow sign
    const signedAmt = !isFixed && flow === 'received' ? -rawAmt : rawAmt
    const units = BigInt(Math.trunc(signedAmt))
    const nanos = Math.round((signedAmt - Number(units)) * 1e9)
    const txDate = isFixed ? dayOfMonthToTimestamp(dayOfMonth) : dateStringToTimestamp(date)
    try {
      await mutateAsync({
        name,
        amount: { units, nanos },
        plannedAmount: { units, nanos },
        date: txDate,
        categoryId,
        paymentMethodId,
        transactionTypeId: typeId,
        transactionFrequencyId: 1,
      })
      logger.info('transaction.update', { budgetProfileId, id: transaction.id, name, flow })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>Edit Transaction</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {isLocked && (
            <Typography variant="body2" color="text.secondary">
              {t('lockedNotice')}
            </Typography>
          )}
          <AmountHeroField value={amount} onChange={setAmount} disabled={isLocked} />
          <TextField
            label="Description"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={isLocked}
          />
          <Stack direction="row" spacing={1} alignItems="flex-start">
            {!isFixed && (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={flow}
                onChange={(_, v) => v && setFlow(v as Flow)}
                disabled={isLocked}
                sx={{ alignSelf: 'center' }}
              >
                <ToggleButton value="spent">{t('flow.spent')}</ToggleButton>
                <ToggleButton value="received">{t('flow.received')}</ToggleButton>
              </ToggleButtonGroup>
            )}
            <TextField
              select
              label="Type"
              value={typeId}
              onChange={(e) => { const v = Number(e.target.value); setTypeId(v); if (v === 1) setFlow('spent') }}
              disabled={isLocked}
              sx={{ flex: 1 }}
            >
              <MenuItem value={1}>Fixed</MenuItem>
              <MenuItem value={2}>Variable</MenuItem>
            </TextField>
          </Stack>
          {isFixed ? (
            <TextField
              label="Day of month"
              type="number"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
              fullWidth
              disabled={isLocked}
              inputProps={{ min: 1, max: 31, inputMode: 'decimal' }}
              helperText="Which day of the month this expense falls on"
            />
          ) : (
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              required
              disabled={isLocked}
              InputLabelProps={{ shrink: true }}
            />
          )}
          <TextField
            select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={0}>— None —</MenuItem>
            {sortedCategories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {c.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />}
                  {categoryName(c)}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <PaymentMethodSelect
            budgetProfileId={budgetProfileId}
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            label="Payment method"
            required
            size="medium"
            disabled={isLocked}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          loading={isPending}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
