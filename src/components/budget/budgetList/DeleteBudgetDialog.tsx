'use client'

import { useTranslations } from 'next-intl'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'

interface Props {
  budget: BudgetProfile
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteBudgetDialog({ budget, onClose, onConfirm, isDeleting }: Props) {
  const t = useTranslations('budget.list.deleteDialog')
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth fullScreen={useIsMobile()}>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('body', { name: budget.name })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isDeleting}>{t('cancel')}</Button>
        <LoadingButton onClick={onConfirm} color="error" variant="contained" loading={isDeleting}>
          {t('delete')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
