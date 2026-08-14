'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

interface Props {
  open: boolean
  onClose: () => void
  /** Opens the Payment Methods management drawer. */
  onGoToPaymentMethods: () => void
}

/**
 * Shown instead of the Add Transaction form when the budget has no payment
 * method yet — see `needsPaymentMethodSetup`. Explains what's missing and
 * takes the user straight there rather than leaving them on a form whose
 * Save button can never enable.
 */
export function PaymentMethodRequiredDialog({ open, onClose, onGoToPaymentMethods }: Props) {
  const t = useTranslations('budget.transactions.paymentMethodRequired')
  const fullScreen = useIsMobile()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('body')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={onGoToPaymentMethods} data-testid="goToPaymentMethods">
          {t('action')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
