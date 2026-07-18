'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

export function DisconnectConfirmDialog({
  connection,
  confirming,
  onConfirm,
  onClose,
}: {
  connection: PlaidConnection | null
  confirming: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const t = useTranslations('settings.plaid')
  const fullScreen = useIsMobile()

  return (
    <Dialog open={!!connection} onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>{t('disconnectTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          {t('disconnectBody', { name: connection?.institutionName || t('unknownBank') })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button color="error" onClick={onConfirm} disabled={confirming}>
          {t('disconnect')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
