'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AuthService } from '@/gen/wellspent/v1/auth_connect'
import { useClient } from '@/hooks/useClient'
import { useIsMobile } from '@/hooks/useIsMobile'
import { logger } from '@/lib/logger'
import { RESEND_COOLDOWN_MS } from '@/lib/auth/verification'
import { ChangeEmailForm } from './ChangeEmailForm'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

/**
 * The block itself. Deliberately impossible to dismiss: no `onClose` (so a
 * backdrop click does nothing) and `disableEscapeKeyDown`. There is no close
 * button — the only ways past it are verifying, correcting the address, or
 * logging out.
 */
export function VerifyEmailDialog({ email }: { email: string }) {
  const t = useTranslations('auth.verifyGate')
  const authClient = useClient(AuthService)
  const router = useRouter()
  const isMobile = useIsMobile()

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(cooldownTimer.current), [])

  async function handleResend() {
    setSending(true)
    setError('')
    try {
      await authClient.resendVerificationEmail({ email })
      setSent(true)
      logger.info('auth.verification.resend')
      cooldownTimer.current = setTimeout(() => setSent(false), RESEND_COOLDOWN_MS)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('resendFailed')
      setError(message)
      logger.error('auth.verification.resend.failed', { error: message })
    } finally {
      setSending(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logger.info('auth.logout')
    } finally {
      router.push('/login')
    }
  }

  return (
    <Dialog open disableEscapeKeyDown fullScreen={isMobile} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t('message', { email })}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {sent && !error && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t('sent')}
          </Alert>
        )}
        {changingEmail ? (
          <ChangeEmailForm currentEmail={email} onCancel={() => setChangingEmail(false)} />
        ) : (
          <Typography variant="body2" sx={{ mt: 2 }}>
            <Link component="button" type="button" onClick={() => setChangingEmail(true)}>
              {t('wrongEmail')}
            </Link>
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button onClick={handleLogout}>{t('logout')}</Button>
        <Button variant="contained" onClick={handleResend} disabled={sending || sent}>
          {sending ? t('sending') : t('resend')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
