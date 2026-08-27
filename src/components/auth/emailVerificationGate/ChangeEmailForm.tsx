'use client'

import { useState } from 'react'
import { ME_QUERY_KEY } from '@/hooks/useMe'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { useClient } from '@/hooks/useClient'
import { logger } from '@/lib/logger'
import { canSubmitEmailChange } from '@/lib/auth/verification'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

/**
 * Correcting an address mistyped at registration — the only way out of the
 * gate for a user whose mail can never arrive.
 *
 * Owns its own draft state and reports nothing back to the parent but "I'm
 * done": on success the changed address arrives through the refreshed GetMe,
 * so there's no value to thread upward.
 */
export function ChangeEmailForm({
  currentEmail,
  onCancel,
}: {
  currentEmail: string
  onCancel: () => void
}) {
  const t = useTranslations('auth.verifyGate')
  const userClient = useClient(UserService)
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await userClient.changeEmail({ newEmail: email })
      logger.info('auth.verification.emailChanged')
      // The gate keys off GetMe, so refreshing it is what swaps the dialog
      // over to the new address.
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      onCancel()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('changeFailed')
      setError(message)
      logger.error('auth.verification.emailChange.failed', { error: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label={t('newEmail')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={Boolean(error)}
        helperText={error || t('newEmailHint')}
        fullWidth
        autoFocus
        size="small"
        inputProps={{ 'aria-label': t('newEmail') }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !canSubmitEmailChange(email, currentEmail)}
        >
          {saving ? t('changing') : t('changeSubmit')}
        </Button>
        <Button onClick={onCancel} disabled={saving}>
          {t('cancel')}
        </Button>
      </Stack>
    </Box>
  )
}
