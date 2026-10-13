'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { IncomeType, RecurringType } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { useBudgetPeople } from '@/hooks/useBudgetPeople'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { unwrap } from '@/lib/api/rest'
import { incomeTypeToRest, recurringTypeToRest } from '@/lib/budget/incomeTransport'
import { isEnabled } from '@/lib/config/features'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

interface Props {
  budgetProfileId: string
  showBeforeTax?: boolean
  onClose: () => void
  onDone: () => void
}

export function AddIncomeDialog({ budgetProfileId, showBeforeTax, onClose, onDone }: Props) {
  const { showError } = useSnackbar()
  const fullScreen = useIsMobile()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [recurring, setRecurring] = useState(true)
  const [beforeTax, setBeforeTax] = useState(false)
  const [budgetPersonId, setBudgetPersonId] = useState<bigint>(0n)

  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()

  const { people } = useBudgetPeople(budgetProfileId)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (vars: {
      name: string
      defaultAmount: { units: bigint; nanos: number }
      recurring: boolean
      beforeTax: boolean
      budgetPersonId: bigint
    }) => {
      if (isEnabled('csharpBudget')) {
        return unwrap(await dotnetClient.POST('/rest/v1/budgets/{id}/income-sources', {
          params: { path: { id: budgetProfileId } },
          body: {
            name: vars.name,
            incomeType: incomeTypeToRest(IncomeType.SALARY),
            defaultAmount: { units: Number(vars.defaultAmount.units), nanos: vars.defaultAmount.nanos, currency: '' },
            recurring: vars.recurring,
            budgetPersonId: vars.budgetPersonId !== 0n ? Number(vars.budgetPersonId) : null,
            paymentFrequency: recurringTypeToRest(RecurringType.UNSPECIFIED),
            beforeTax: vars.beforeTax,
          },
        }))
      }
      return client.addIncomeSource({ budgetProfileId, incomeType: IncomeType.SALARY, ...vars })
    },
  })

  const amountError = amount !== '' && parseFloat(amount) <= 0 ? 'Amount must be greater than zero' : ''

  async function handleSave() {
    if (!name.trim() || !amount || amountError) return
    const units = Math.floor(parseFloat(amount))
    const nanos = Math.round((parseFloat(amount) - units) * 1e9)
    try {
      await mutateAsync({ name, defaultAmount: { units: BigInt(units), nanos }, recurring, beforeTax, budgetPersonId })
      logger.info('budget.income.add', { budgetProfileId, name, amount })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>Add income source</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Source name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g. Salary"
          />
          <TextField
            label="Monthly amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
            error={!!amountError}
            helperText={amountError}
          />
          <FormControlLabel
            control={<Checkbox checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />}
            label="Recurring monthly"
          />
          {showBeforeTax && (
            <FormControlLabel
              control={<Checkbox checked={beforeTax} onChange={(e) => setBeforeTax(e.target.checked)} />}
              label="Before-tax income (used for tax reserve estimate)"
            />
          )}
          {people.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Attributed to</InputLabel>
              <Select
                label="Attributed to"
                value={budgetPersonId.toString()}
                onChange={(e) => setBudgetPersonId(BigInt(e.target.value))}
              >
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
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !amount || !!amountError}
          loading={isPending}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
