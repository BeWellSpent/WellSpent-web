'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { SavingsSource } from '@/gen/spendsense/v1/budget_pb'
import { RecurringType } from '@/gen/spendsense/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

interface Props {
  budgetProfileId: string
  source: SavingsSource
  onClose: () => void
  onDone: () => void
}

const FREQUENCY_OPTIONS = [
  { value: RecurringType.WEEKLY, label: 'Weekly' },
  { value: RecurringType.BI_WEEKLY, label: 'Bi-weekly' },
  { value: RecurringType.MONTHLY, label: 'Monthly' },
]

export function EditSavingsModal({ budgetProfileId, source, onClose, onDone }: Props) {
  const { showError } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [name, setName] = useState(source.name)
  const [amount, setAmount] = useState(() => {
    const total = Number(source.amount?.units ?? 0n) + (source.amount?.nanos ?? 0) / 1e9
    return total.toString()
  })
  const [frequency, setFrequency] = useState<RecurringType>(source.frequency)
  const [recurring, setRecurring] = useState(source.recurring)
  const [budgetPersonId, setBudgetPersonId] = useState<bigint>(source.budgetPersonId)

  useEffect(() => {
    setName(source.name)
    const total = Number(source.amount?.units ?? 0n) + (source.amount?.nanos ?? 0) / 1e9
    setAmount(total.toString())
    setFrequency(source.frequency)
    setRecurring(source.recurring)
    setBudgetPersonId(source.budgetPersonId)
  }, [source])

  const client = useClient(BudgetService)

  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const people = peopleData?.people ?? []

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      frequency: RecurringType
      recurring: boolean
      budgetPersonId: bigint
    }) => client.updateSavingsSource({ id: source.id, budgetProfileId, ...vars }),
  })

  async function handleSave() {
    if (!name.trim() || !amount) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, amount: { units: BigInt(units), nanos }, frequency, recurring, budgetPersonId })
      logger.info('budget.savings.update', { budgetProfileId, id: source.id.toString(), name })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>Edit savings source</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g. Emergency fund"
          />
          <TextField
            label="Amount per occurrence"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Frequency</InputLabel>
            <Select
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringType)}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />}
            label="Carry forward to next period"
          />
          {people.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Attributed to</InputLabel>
              <Select
                label="Attributed to"
                value={budgetPersonId.toString()}
                onChange={(e) => setBudgetPersonId(BigInt(e.target.value))}
              >
                <MenuItem value="0">Unattributed</MenuItem>
                {people.map((p) => (
                  <MenuItem key={p.id.toString()} value={p.id.toString()}>
                    {p.userName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !amount || isPending}
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
