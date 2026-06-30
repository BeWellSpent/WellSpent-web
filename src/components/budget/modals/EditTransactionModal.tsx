'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { Transaction } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetProfileId: string
  transaction: Transaction
  onClose: () => void
  onDone: () => void
}

function moneyToString(units: bigint, nanos: number): string {
  const total = Number(units) + nanos / 1e9
  return total.toFixed(2)
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

export function EditTransactionModal({ budgetProfileId, transaction, onClose, onDone }: Props) {
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const client = useClient(BudgetService)

  const [name, setName] = useState(transaction.name)
  const [amount, setAmount] = useState(() =>
    moneyToString(transaction.amount?.units ?? 0n, transaction.amount?.nanos ?? 0)
  )
  const [typeId, setTypeId] = useState(transaction.transactionTypeId)
  const [date, setDate] = useState(() => timestampToDateString(transaction.date))
  const [dayOfMonth, setDayOfMonth] = useState(() => timestampToDayOfMonth(transaction.date))
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [paymentMethodId, setPaymentMethodId] = useState(transaction.paymentMethodId)
  const [recurring, setRecurring] = useState(transaction.recurring)

  const isFixed = typeId === 1

  useEffect(() => {
    setName(transaction.name)
    setAmount(moneyToString(transaction.amount?.units ?? 0n, transaction.amount?.nanos ?? 0))
    setTypeId(transaction.transactionTypeId)
    setDate(timestampToDateString(transaction.date))
    setDayOfMonth(timestampToDayOfMonth(transaction.date))
    setCategoryId(transaction.categoryId)
    setPaymentMethodId(transaction.paymentMethodId)
    setRecurring(transaction.recurring)
  }, [transaction])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.listCategories({}),
  })
  const { data: methodsData } = useQuery({
    queryKey: ['paymentMethods', budgetProfileId],
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })
  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  const methods = methodsData?.methods ?? []
  const personMap = new Map((peopleData?.people ?? []).map((p) => [p.id.toString(), p]))

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      date: { seconds: bigint; nanos: number }
      categoryId: number
      paymentMethodId: string
      transactionTypeId: number
      transactionFrequencyId: number
      recurring: boolean
    }) => client.updateTransaction({ id: transaction.id, plannedAmount: vars.amount, ...vars }),
  })

  const isDateValid = isFixed ? dayOfMonth >= 1 && dayOfMonth <= 31 : !!date
  const canSave = !!name.trim() && !!amount && !!paymentMethodId && isDateValid

  async function handleSave() {
    if (!canSave) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    const txDate = isFixed ? dayOfMonthToTimestamp(dayOfMonth) : dateStringToTimestamp(date)
    try {
      await mutateAsync({
        name,
        amount: { units: BigInt(units), nanos },
        date: txDate,
        categoryId,
        paymentMethodId,
        transactionTypeId: typeId,
        transactionFrequencyId: recurring ? 4 : 1,
        recurring,
      })
      logger.info('transaction.update', { budgetProfileId, id: transaction.id, name })
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
          <TextField
            label="Description"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            select
            label="Type"
            value={typeId}
            onChange={(e) => setTypeId(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={1}>Fixed</MenuItem>
            <MenuItem value={2}>Variable</MenuItem>
          </TextField>
          {isFixed ? (
            <TextField
              label="Day of month"
              type="number"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
              fullWidth
              inputProps={{ min: 1, max: 31 }}
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
            {(categoriesData?.categories ?? []).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Payment method"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
            fullWidth
            required
            SelectProps={{
              renderValue: (val) => {
                const m = methods.find((x) => x.id === val)
                if (!m) return val as string
                const person = m.budgetPersonId && m.budgetPersonId !== 0n ? personMap.get(m.budgetPersonId.toString()) : undefined
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {m.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />}
                    <span>{m.name}{person ? ` · ${person.userName}` : ''}</span>
                  </Box>
                )
              },
            }}
          >
            {methods.map((m) => {
              const person = m.budgetPersonId && m.budgetPersonId !== 0n ? personMap.get(m.budgetPersonId.toString()) : undefined
              return (
                <MenuItem key={m.id} value={m.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                        bgcolor: m.color || 'transparent',
                        border: '1px solid',
                        borderColor: m.color ? 'transparent' : 'divider',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.3 }}>{m.name}</Typography>
                      {person && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                          {person.userName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              )
            })}
          </TextField>
          {!isFixed && (
            <FormControlLabel
              control={<Checkbox checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />}
              label="Recurring"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave || isPending}
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
