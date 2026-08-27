'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { SavingsSourceFields } from '@/components/budget/savingsForm/SavingsSourceFields'
import { useSavingsSourceDraft, moneyFromDecimalString } from '@/components/budget/savingsForm/useSavingsSourceDraft'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

interface Props {
  budgetProfileId: string
  onDone: () => void
}

/**
 * The wizard's savings step — add as many sources as you like, then finish.
 *
 * Placed after Payment methods rather than at the end for its own sake: a
 * savings source requires a payment method (`savings_source.payment_method_id`
 * is not nullable in practice for user-created sources), so this step is
 * unusable until that one has run.
 */
export function AddSavingsStep({ budgetProfileId, onDone }: Props) {
  const t = useTranslations('budget.setup.savings')
  const tActions = useTranslations('budget.setup.actions')
  const { showError } = useSnackbar()
  const [saved, setSaved] = useState<string[]>([])
  const draft = useSavingsSourceDraft()

  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: {
      name: string
      amount: { units: bigint; nanos: number }
      paymentMethodId: string
      paymentDays: number[]
    }) => client.addSavingsSource({ budgetProfileId, ...vars }),
  })

  async function handleAdd() {
    if (!draft.isValid) return
    try {
      await mutateAsync({
        name: draft.name,
        amount: moneyFromDecimalString(draft.amount),
        paymentMethodId: draft.paymentMethodId,
        paymentDays: draft.paymentDays,
      })
      logger.info('budget.savings.add', { budgetProfileId, name: draft.name })
      setSaved((prev) => [...prev, draft.name])
      draft.reset()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">{t('help')}</Typography>

      {saved.length > 0 && (
        <>
          <List dense disablePadding>
            {saved.map((name, i) => (
              <ListItem key={i} disableGutters sx={{ gap: 1 }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </>
      )}

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

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="outlined" onClick={onDone}>
          {saved.length === 0 ? tActions('skip') : tActions('finish')}
        </Button>
        <LoadingButton variant="contained" onClick={handleAdd} disabled={!draft.isValid} loading={isPending}>
          {tActions('add')}
        </LoadingButton>
      </Stack>
    </Stack>
  )
}
