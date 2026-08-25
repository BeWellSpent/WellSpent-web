'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useRouter } from '@/i18n/navigation'
import { formatError, isSessionError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import LogoutIcon from '@mui/icons-material/Logout'
import { BudgetSetupFlow } from './BudgetSetupFlow'

/**
 * `/budgets` — the entry point every sign-in lands on.
 *
 * It no longer renders a list. An account may own exactly one budget, so this
 * resolves that budget and forwards straight to it (issue #60); the only
 * thing it draws itself is the first-run state, where there is no budget yet
 * and therefore no Plan view to be home.
 *
 * The redirect is `replace`, not `push` — leaving this in history would make
 * Back from the budget bounce straight forward again.
 */
export function BudgetHome() {
  const t = useTranslations('budget.list')
  // "Logout" lives under budget.sidebar because the sidebar and manage drawer
  // already label their button from it.
  const tChrome = useTranslations('budget.sidebar')
  const locale = useLocale()
  const router = useRouter()
  const client = useClient(BudgetService)
  const [setupOpen, setSetupOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => client.listBudgetProfiles({}),
  })

  const profile = data?.profiles?.[0]

  useEffect(() => {
    if (profile) {
      logger.info('budget.home.redirect', { budgetId: profile.id })
      router.replace(`/budgets/${profile.id}`)
    }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isError && isSessionError(error)) {
      fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login', { locale }))
    }
  }, [isError, error]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login', { locale })
  }

  // Still showing the spinner while the redirect above is in flight — this
  // screen should never flash its empty state at someone who has a budget.
  if (isLoading || profile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (isError) {
    const message = formatError(error)
    logger.error('budget.list.failed', { error: message })
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error" mb={2}>{message}</Typography>
        <Button variant="outlined" onClick={() => refetch()}>{t('retry')}</Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Tooltip title={tChrome('logout')}>
          <IconButton onClick={handleLogout} aria-label={tChrome('logout')}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body1" mb={2}>{t('empty')}</Typography>
        <Button variant="contained" onClick={() => setSetupOpen(true)}>{t('createBudget')}</Button>
      </Box>

      <BudgetSetupFlow
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onComplete={() => {
          setSetupOpen(false)
          refetch()
        }}
      />
    </Box>
  )
}
