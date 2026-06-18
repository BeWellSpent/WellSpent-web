'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import { AddPeopleModal } from './modals/AddPeopleModal'
import { AddIncomeModal } from './modals/AddIncomeModal'
import { AddTransactionModal } from './modals/AddTransactionModal'

const STEPS = ['Create Budget', 'Add People', 'Add Income', 'First Transaction']

interface Props {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function BudgetSetupFlow({ open, onClose, onComplete }: Props) {
  const { showError, showSuccess } = useSnackbar()
  const [step, setStep] = useState(0)
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [budgetName, setBudgetName] = useState('')
  const client = useClient(BudgetService)

  const { mutateAsync: doCreateBudget, isPending } = useMutation({
    mutationFn: (name: string) => client.createBudget({ name }),
  })

  function handleClose() {
    setStep(0)
    setBudgetId(null)
    setBudgetName('')
    onClose()
  }

  async function handleCreateBudget() {
    try {
      const res = await doCreateBudget(budgetName)
      const id = res.budget?.id ?? ''
      setBudgetId(id)
      logger.info('budget.create', { budgetId: id, name: budgetName })
      setStep(1)
    } catch (err) {
      showError(err)
    }
  }

  function handleSkipOrNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      showSuccess('Budget set up successfully!')
      onComplete()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set up your budget</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">Give your budget a name to get started.</Typography>
            <TextField
              label="Budget name"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        )}

        {step === 1 && budgetId && (
          <AddPeopleModal budgetId={budgetId} embedded onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
        )}

        {step === 2 && budgetId && (
          <AddIncomeModal budgetId={budgetId} embedded onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
        )}

        {step === 3 && budgetId && (
          <AddTransactionModal budgetId={budgetId} embedded onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
        )}
      </DialogContent>

      {step === 0 && (
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBudget} disabled={!budgetName.trim() || isPending}>
            {isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
