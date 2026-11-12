'use client'

import { useEffect, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import ErrorOutline from '@mui/icons-material/ErrorOutline'
import { useTranslations } from 'next-intl'
import { verifyEmail } from '@/lib/api'
import { StandalonePage } from './StandalonePage'

type Status = 'verifying' | 'success' | 'error'

/** Redeems the link from the verification email, then sends the reader back to the app. */
export function VerifyEmailStatus({ token }: { token: string }) {
  const t = useTranslations('standalone.verifyEmail')
  const [status, setStatus] = useState<Status>('verifying')

  useEffect(() => {
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((error: unknown) => {
        console.error('verify-email failed', { error: error instanceof Error ? error.message : String(error) })
        setStatus('error')
      })
  }, [token])

  if (status === 'verifying') {
    return <StandalonePage icon={<CircularProgress size={32} />} title={t('verifyingTitle')} body={t('verifyingBody')} />
  }
  if (status === 'success') {
    return <StandalonePage icon={<CheckCircleOutline sx={{ fontSize: 40, color: 'success.main' }} />} title={t('successTitle')} body={t('successBody')} />
  }
  return <StandalonePage icon={<ErrorOutline sx={{ fontSize: 40, color: 'error.main' }} />} title={t('errorTitle')} body={t('errorBody')} />
}
