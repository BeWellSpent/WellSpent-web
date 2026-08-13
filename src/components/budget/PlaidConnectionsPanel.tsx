'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { useIsFreeTier } from '@/hooks/useUserPlan'
import { usePlaidConnections } from '@/components/plaid/usePlaidConnections'
import { PlaidLinkLauncher } from '@/components/plaid/PlaidLinkLauncher'
import { ConnectionRow } from '@/components/plaid/ConnectionRow'
import { DisconnectConfirmDialog } from '@/components/plaid/DisconnectConfirmDialog'
import { ResyncConfirmDialog } from '@/components/plaid/ResyncConfirmDialog'
import { SyncWarningBanner } from '@/components/plaid/SyncWarningBanner'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

/**
 * Every member's bank connections feeding one budget.
 *
 * The point of showing other people's here is that a broken or skipped
 * connection is a *budget* problem — transactions stop arriving for everyone —
 * but only its owner can see or fix it from Settings. Rows the caller doesn't
 * own are read-only; the backend enforces that independently.
 */
export function PlaidConnectionsPanel({ budgetProfileId }: { budgetProfileId: string }) {
  const t = useTranslations('plaid')
  const isFree = useIsFreeTier()

  const [confirmDisconnect, setConfirmDisconnect] = useState<PlaidConnection | null>(null)
  const [confirmResync, setConfirmResync] = useState<PlaidConnection | null>(null)

  const plaid = usePlaidConnections(budgetProfileId)

  // Only this budget's warnings: the response covers every budget the caller
  // belongs to, and another budget's problem isn't actionable from here.
  const warnings = plaid.syncWarnings.filter((w) => w.budgetProfileId === budgetProfileId)

  async function handleDisconnectConfirm() {
    if (!confirmDisconnect) return
    const id = confirmDisconnect.id
    setConfirmDisconnect(null)
    await plaid.disconnect(id)
  }

  async function handleResyncConfirm() {
    if (!confirmResync) return
    const id = confirmResync.id
    setConfirmResync(null)
    await plaid.resync(id)
  }

  return (
    <Box>
      {plaid.linkSession && (
        <PlaidLinkLauncher
          token={plaid.linkSession.token}
          onSuccess={plaid.handleLinkSuccess}
          onExit={plaid.handleLinkExit}
        />
      )}

      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {t('budgetPanelIntro')}
        </Typography>

        {isFree && (
          <Chip label={t('freeTierNote')} size="small" color="warning" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
        )}

        <SyncWarningBanner warnings={warnings} />

        {plaid.isLoading ? (
          <CircularProgress size={20} />
        ) : plaid.connections.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('emptyForBudget')}
          </Typography>
        ) : (
          plaid.connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              subtitle={conn.ownerName || t('unknownMember')}
              onManageAccounts={() => plaid.startManageAccounts(conn)}
              managingAccounts={plaid.managingAccountsId === conn.id}
              manageAccountsDisabled={isFree}
              onDisconnect={() => setConfirmDisconnect(conn)}
              disconnecting={plaid.disconnectingId === conn.id}
              onResync={() => setConfirmResync(conn)}
              resyncing={plaid.resyncingId === conn.id}
            />
          ))
        )}

        <Button
          variant="outlined"
          startIcon={plaid.isConnecting ? <CircularProgress size={16} /> : <AccountBalanceIcon />}
          disabled={plaid.isConnecting || isFree}
          onClick={() => plaid.startConnect(budgetProfileId)}
          sx={{ alignSelf: 'flex-start' }}
          size="small"
        >
          {t('connect')}
        </Button>
      </Stack>

      <DisconnectConfirmDialog
        connection={confirmDisconnect}
        confirming={plaid.isDisconnecting}
        onConfirm={handleDisconnectConfirm}
        onClose={() => setConfirmDisconnect(null)}
      />

      <ResyncConfirmDialog
        connection={confirmResync}
        confirming={plaid.resyncingId !== null}
        onConfirm={handleResyncConfirm}
        onClose={() => setConfirmResync(null)}
      />
    </Box>
  )
}
