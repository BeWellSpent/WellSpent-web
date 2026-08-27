'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'

interface Props {
  budgetName: string
  /** True once the budget exists — before that, cancelling destroys nothing. */
  hasBudget: boolean
  loading: boolean
  onKeepGoing: () => void
  onConfirm: () => void
}

/**
 * Confirms abandoning setup.
 *
 * Worth a confirmation rather than a bare ✕ because the budget already exists
 * by every step after the first, so "cancel" here is a delete — of the people,
 * payment methods, income and savings added along the way, and of any
 * invitation already emailed out.
 */
export function CancelSetupDialog({ budgetName, hasBudget, loading, onKeepGoing, onConfirm }: Props) {
  const t = useTranslations('budget.setup.cancelDialog')
  const fullScreen = useIsMobile()

  return (
    <Dialog open onClose={onKeepGoing} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {hasBudget ? t('bodyWithBudget', { name: budgetName }) : t('bodyNoBudget')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onKeepGoing} color="inherit">{t('keep')}</Button>
        <LoadingButton color="error" variant="contained" onClick={onConfirm} loading={loading}>
          {hasBudget ? t('confirmDelete') : t('confirmDiscard')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
