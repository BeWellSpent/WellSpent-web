'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useMutation } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useIsMobile } from '@/hooks/useIsMobile'

export function AccountManagement() {
  const t = useTranslations('settings.accountManagement')
  const client = useClient(UserService)
  const router = useRouter()
  const { showError } = useSnackbar()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => client.deleteMe({}),
  })

  async function handleDelete() {
    try {
      await mutateAsync()
      logger.info('user.account.deleted')
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('deleteDescription')}
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        {t('deleteAccount')}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen={isMobile}>
        <DialogTitle>{t('confirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('confirmBody')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={isPending}>
            {t('cancel')}
          </Button>
          <LoadingButton color="error" variant="contained" onClick={handleDelete} loading={isPending}>
            {t('confirmDelete')}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
