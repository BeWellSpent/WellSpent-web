'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTranslations } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetCycle } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useMe } from '@/hooks/useMe'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { AddPeopleModal } from './modals/AddPeopleModal'
import { AddIncomeModal } from './modals/AddIncomeModal'
import { AddPaymentMethodsStep } from './modals/AddPaymentMethodsStep'
import { AddSavingsStep } from './modals/AddSavingsStep'
import { CancelSetupDialog } from './setupFlow/CancelSetupDialog'
import { SETUP_STEPS, SETUP_STEP_LABEL_KEYS, nextStep, previousStep, type SetupStep } from './setupFlow/steps'

interface Props {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function BudgetSetupFlow({ open, onClose, onComplete }: Props) {
  const t = useTranslations('budget.setup')
  const tActions = useTranslations('budget.setup.actions')
  const { showError, showSuccess } = useSnackbar()
  const fullScreen = useIsMobile()

  const [step, setStep] = useState<SetupStep>('create')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [budgetName, setBudgetName] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)

  const client = useClient(BudgetService)

  const { user: me } = useMe()
  const showBeforeTax = me?.countryCode === 'US'

  const { mutateAsync: doCreateProfile, isPending } = useMutation({
    mutationFn: (name: string) => client.createBudgetProfile({ name, cycle: BudgetCycle.MONTHLY }),
  })

  const { mutateAsync: doDeleteProfile, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => client.deleteBudgetProfile({ id }),
  })

  function reset() {
    setStep('create')
    setProfileId(null)
    setBudgetName('')
    setCancelOpen(false)
  }

  function handleFinishLater() {
    showSuccess(t('finishLater'))
    reset()
    onComplete()
  }

  /**
   * Retracts the whole thing.
   *
   * Deleting the profile is enough to remove everything added during setup —
   * people, income, savings and any invitation all cascade from it — and the
   * backend clears the budget's payment methods alongside, since those are the
   * one thing with no cascade path of their own.
   */
  async function handleCancelConfirmed() {
    if (!profileId) {
      reset()
      onClose()
      return
    }
    try {
      await doDeleteProfile(profileId)
      logger.info('budget.setup.cancelled', { budgetId: profileId })
      reset()
      // onComplete, not onClose: the caller has to re-read its budget list,
      // which no longer contains the profile it was told about at step 1.
      onComplete()
    } catch (err) {
      showError(err)
      setCancelOpen(false)
    }
  }

  async function handleCreateBudget() {
    try {
      const res = await doCreateProfile(budgetName)
      const id = res.profile?.id ?? ''
      setProfileId(id)
      logger.info('budget.create', { budgetId: id, name: budgetName })
      setStep('people')
    } catch (err) {
      showError(err)
    }
  }

  function handleSkipOrNext() {
    const next = nextStep(step)
    if (next) {
      setStep(next)
    } else {
      showSuccess(t('complete'))
      reset()
      onComplete()
    }
  }

  const back = previousStep(step)

  return (
    <>
      <Dialog open={open} onClose={undefined} maxWidth="sm" fullWidth fullScreen={fullScreen}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('title')}
          <IconButton size="small" onClick={() => setCancelOpen(true)} title={tActions('cancel')} aria-label={tActions('cancel')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={SETUP_STEPS.indexOf(step)} sx={{ mb: 3 }}>
            {SETUP_STEPS.map((s) => (
              <Step key={s}><StepLabel>{t(SETUP_STEP_LABEL_KEYS[s])}</StepLabel></Step>
            ))}
          </Stepper>

          {step === 'create' && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">{t('create.help')}</Typography>
              <TextField
                label={t('create.name')}
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && budgetName.trim() && !isPending && handleCreateBudget()}
                fullWidth
                autoFocus
              />
            </Stack>
          )}

          {step === 'people' && profileId && (
            <AddPeopleModal budgetProfileId={profileId} onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
          )}

          {step === 'paymentMethods' && profileId && (
            <AddPaymentMethodsStep budgetProfileId={profileId} onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
          )}

          {step === 'income' && profileId && (
            <AddIncomeModal budgetProfileId={profileId} showBeforeTax={showBeforeTax} onSkip={handleSkipOrNext} onDone={handleSkipOrNext} />
          )}

          {step === 'savings' && profileId && (
            <AddSavingsStep budgetProfileId={profileId} onDone={handleSkipOrNext} />
          )}
        </DialogContent>

        {step === 'create' ? (
          <DialogActions>
            <Button onClick={() => setCancelOpen(true)} color="inherit">{tActions('cancel')}</Button>
            <LoadingButton variant="contained" onClick={handleCreateBudget} disabled={!budgetName.trim()} loading={isPending}>
              {t('create.submit')}
            </LoadingButton>
          </DialogActions>
        ) : (
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button onClick={handleFinishLater} color="inherit" size="small">{tActions('finishLater')}</Button>
            {back && back !== 'create' && (
              <Button onClick={() => setStep(back)} color="inherit" size="small">{tActions('back')}</Button>
            )}
          </DialogActions>
        )}
      </Dialog>

      {cancelOpen && (
        <CancelSetupDialog
          budgetName={budgetName}
          hasBudget={profileId !== null}
          loading={isDeleting}
          onKeepGoing={() => setCancelOpen(false)}
          onConfirm={handleCancelConfirmed}
        />
      )}
    </>
  )
}
