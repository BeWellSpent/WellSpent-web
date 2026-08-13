'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

/**
 * Confirms a full-history replay.
 *
 * The warning is deliberately specific rather than a generic "may create
 * duplicates". Re-importing an already-imported transaction can't duplicate
 * it — `plaid_transaction_id` is unique and the sync skips anything it has
 * seen. What a replay really does is bring back transactions the user
 * *deleted*, which is both the actual risk and the one they can act on.
 */
export function ResyncConfirmDialog({
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
  const t = useTranslations('plaid')
  const fullScreen = useIsMobile()

  return (
    <Dialog open={!!connection} onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>{t('resyncTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            {t('resyncBody', { name: connection?.institutionName || t('unknownBank') })}
          </Typography>
          <Alert severity="warning">{t('resyncWarning')}</Alert>
          <Typography variant="caption" color="text.secondary">
            {t('resyncOncePerDay')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={onConfirm} disabled={confirming}>
          {t('resync')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
