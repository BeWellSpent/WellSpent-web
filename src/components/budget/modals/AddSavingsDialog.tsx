'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { SavingsSourceFields } from '@/components/budget/savingsForm/SavingsSourceFields'
import { useSavingsSourceDraft, moneyFromDecimalString } from '@/components/budget/savingsForm/useSavingsSourceDraft'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'

interface Props {
  budgetProfileId: string
  activePeriodStart?: Date
  onClose: () => void
  onDone: () => void
}

export function AddSavingsDialog({ budgetProfileId, activePeriodStart, onClose, onDone }: Props) {
  const t = useTranslations('budget.savings.addDialog')
  const { showError } = useSnackbar()
  const fullScreen = useIsMobile()
  const queryClient = useQueryClient()
  const draft = useSavingsSourceDraft(activePeriodStart)

  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      paymentMethodId: string
      paymentDays: number[]
    }) => client.addSavingsSource({ budgetProfileId, ...vars }),
  })

  async function handleSave() {
    if (!draft.isValid) return
    try {
      await mutateAsync({
        name: draft.name,
        amount: moneyFromDecimalString(draft.amount),
        paymentMethodId: draft.paymentMethodId,
        paymentDays: draft.paymentDays,
      })
      logger.info('budget.savings.add', { budgetProfileId, name: draft.name })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="xs">
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <SavingsSourceFields
          budgetProfileId={budgetProfileId}
          name={draft.name}
          onNameChange={draft.setName}
          amount={draft.amount}
          onAmountChange={draft.setAmount}
          paymentMethodId={draft.paymentMethodId}
          onPaymentMethodChange={draft.setPaymentMethodId}
          paymentDays={draft.paymentDays}
          onToggleDay={draft.toggleDay}
          daysInMonth={draft.daysInMonth}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t('cancel')}</Button>
        <LoadingButton variant="contained" onClick={handleSave} disabled={!draft.isValid} loading={isPending}>
          {t('save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
