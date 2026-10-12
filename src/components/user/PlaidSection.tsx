'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { useBudgetProfiles } from '@/hooks/useBudgetProfiles'
import { useIsFreeTier } from '@/hooks/useUserPlan'
import { usePlaidConnections } from '@/components/plaid/usePlaidConnections'
import { PlaidLinkLauncher } from '@/components/plaid/PlaidLinkLauncher'
import { ConnectionRow } from '@/components/plaid/ConnectionRow'
import { DisconnectConfirmDialog } from '@/components/plaid/DisconnectConfirmDialog'
import { ResyncConfirmDialog } from '@/components/plaid/ResyncConfirmDialog'
import { SyncWarningBanner } from '@/components/plaid/SyncWarningBanner'
import { BudgetPickerDialog } from './plaidSection/BudgetPickerDialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

/**
 * The user's own connections, across every budget.
 *
 * Deliberately kept alongside the per-budget panel rather than replaced by it:
 * budget membership is what grants access to a budget's connection list, so a
 * member removed from a budget would otherwise have no way to reach — or
 * disconnect — a bank they themselves linked.
 */
export function PlaidSection() {
  const t = useTranslations('plaid')
  const isFree = useIsFreeTier()

  const [pickingBudget, setPickingBudget] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState<PlaidConnection | null>(null)
  const [confirmResync, setConfirmResync] = useState<PlaidConnection | null>(null)

  const plaid = usePlaidConnections()

  const { data: budgetsData } = useBudgetProfiles()
  const budgets = budgetsData?.profiles ?? []
  const budgetNameMap = Object.fromEntries(budgets.map((b) => [b.id, b.name]))

  async function handleBudgetSelected(budgetId: string) {
    setPickingBudget(false)
    await plaid.startConnect(budgetId)
  }

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
        {isFree && (
          <Chip label={t('freeTierNote')} size="small" color="warning" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
        )}

        {/* Above the list deliberately: it concerns connections that aren't in
            the list at all, since this screen only shows the caller's own. */}
        <SyncWarningBanner warnings={plaid.syncWarnings} />

        {plaid.isLoading ? (
          <CircularProgress size={20} />
        ) : plaid.connections.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('empty')}
          </Typography>
        ) : (
          plaid.connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              subtitle={budgetNameMap[conn.budgetProfileId] ?? t('unknownBudget')}
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
          onClick={() => setPickingBudget(true)}
          sx={{ alignSelf: 'flex-start' }}
          size="small"
        >
          {t('connect')}
        </Button>
      </Stack>

      <BudgetPickerDialog
        open={pickingBudget}
        budgets={budgets}
        onSelect={handleBudgetSelected}
        onClose={() => setPickingBudget(false)}
      />

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
