'use client'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import type { BudgetSyncWarning } from '@/gen/wellspent/v1/plaid_pb'

type Props = {
  warnings: BudgetSyncWarning[]
}

/**
 * Warns that some connections on a shared budget will never sync.
 *
 * Plaid sync is entitled per connection owner rather than per budget, so a
 * free-tier member of a paid budget can link a bank that is then skipped on
 * every run. That was previously invisible on both clients — they only fetch
 * the caller's own connections, so a co-member's simply didn't appear
 * anywhere. One went unsynced for over two weeks before anyone noticed.
 */
export function SyncWarningBanner({ warnings }: Props) {
  const t = useTranslations('plaid')

  if (warnings.length === 0) return null

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {warnings.map((warning) => (
        <Alert severity="warning" key={`${warning.budgetProfileId}-${warning.memberName}`}>
          <AlertTitle>{t('syncWarningTitle')}</AlertTitle>
          {warning.isCurrentUser
            ? t('syncWarningSelf', {
                count: warning.connectionCount,
                budget: warning.budgetName,
              })
            : t('syncWarningMember', {
                count: warning.connectionCount,
                member: warning.memberName,
                budget: warning.budgetName,
              })}
        </Alert>
      ))}
    </Box>
  )
}
