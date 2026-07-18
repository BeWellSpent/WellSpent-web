'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlaidService } from '@/gen/wellspent/v1/plaid_connect'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { PlaidLinkLauncher } from './plaidSection/PlaidLinkLauncher'
import { ConnectionRow } from './plaidSection/ConnectionRow'
import { BudgetPickerDialog } from './plaidSection/BudgetPickerDialog'
import { DisconnectConfirmDialog } from './plaidSection/DisconnectConfirmDialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

// A fresh connect exchanges the returned public_token for a new item.
// An update-mode session (account selection on an existing item) doesn't
// return a usable public_token — Link still calls onSuccess, but the right
// follow-up is to re-sync the connection's account list, not exchange.
type LinkSession =
  | { mode: 'connect'; token: string; budgetProfileId: string }
  | { mode: 'update'; token: string; connectionId: string }

export function PlaidSection() {
  const t = useTranslations('settings.plaid')
  const { showError } = useSnackbar()
  const queryClient = useQueryClient()

  const plaidClient = useClient(PlaidService)
  const budgetClient = useClient(BudgetService)

  const [pickingBudget, setPickingBudget] = useState(false)
  const [linkSession, setLinkSession] = useState<LinkSession | null>(null)
  const [managingAccountsId, setManagingAccountsId] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState<PlaidConnection | null>(null)

  const { data: connectionsData, isLoading: loadingConnections } = useQuery({
    queryKey: ['plaidConnections'],
    queryFn: () => plaidClient.getPlaidConnections({}),
  })

  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => budgetClient.listBudgetProfiles({}),
  })

  const connections = connectionsData?.connections ?? []
  const budgets = budgetsData?.profiles ?? []

  const budgetNameMap = Object.fromEntries(budgets.map((b) => [b.id, b.name]))

  const createTokenMutation = useMutation({
    mutationFn: (budgetProfileId: string) => plaidClient.createLinkToken({ budgetProfileId }),
  })

  const createUpdateTokenMutation = useMutation({
    mutationFn: (args: { budgetProfileId: string; connectionId: string }) =>
      plaidClient.createLinkToken(args),
  })

  const exchangeMutation = useMutation({
    mutationFn: ({ publicToken, budgetProfileId }: { publicToken: string; budgetProfileId: string }) =>
      plaidClient.exchangePublicToken({ publicToken, budgetProfileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] })
      logger.info('plaid.connect.success')
    },
  })

  const refreshAccountsMutation = useMutation({
    mutationFn: (connectionId: string) => plaidClient.refreshPlaidAccounts({ connectionId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] })
      if (res.connection?.budgetProfileId) {
        queryClient.invalidateQueries({ queryKey: ['paymentMethods', res.connection.budgetProfileId] })
      }
      logger.info('plaid.refreshAccounts.success')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => plaidClient.disconnectPlaid({ connectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plaidConnections'] })
      logger.info('plaid.disconnect.success')
    },
  })

  async function handleBudgetSelected(budgetId: string) {
    setPickingBudget(false)
    try {
      const res = await createTokenMutation.mutateAsync(budgetId)
      setLinkSession({ mode: 'connect', token: res.linkToken, budgetProfileId: budgetId })
    } catch (err) {
      showError(err)
    }
  }

  async function handleManageAccounts(conn: PlaidConnection) {
    setManagingAccountsId(conn.id)
    try {
      const res = await createUpdateTokenMutation.mutateAsync({
        budgetProfileId: conn.budgetProfileId,
        connectionId: conn.id,
      })
      setLinkSession({ mode: 'update', token: res.linkToken, connectionId: conn.id })
    } catch (err) {
      showError(err)
      setManagingAccountsId(null)
    }
  }

  const handlePlaidSuccess = useCallback(
    async (publicToken: string) => {
      const session = linkSession
      setLinkSession(null)
      if (!session) return
      try {
        if (session.mode === 'connect') {
          await exchangeMutation.mutateAsync({ publicToken, budgetProfileId: session.budgetProfileId })
        } else {
          await refreshAccountsMutation.mutateAsync(session.connectionId)
        }
      } catch (err) {
        showError(err)
      } finally {
        setManagingAccountsId(null)
      }
    },
    [linkSession, exchangeMutation, refreshAccountsMutation, showError],
  )

  const handlePlaidExit = useCallback(() => {
    setLinkSession(null)
    setManagingAccountsId(null)
  }, [])

  async function handleDisconnectConfirm() {
    if (!confirmDisconnect) return
    const id = confirmDisconnect.id
    setConfirmDisconnect(null)
    setDisconnectingId(id)
    try {
      await disconnectMutation.mutateAsync(id)
    } catch (err) {
      showError(err)
    } finally {
      setDisconnectingId(null)
    }
  }

  const isFetchingToken = createTokenMutation.isPending || exchangeMutation.isPending

  return (
    <Box>
      {linkSession && (
        <PlaidLinkLauncher
          token={linkSession.token}
          onSuccess={handlePlaidSuccess}
          onExit={handlePlaidExit}
        />
      )}

      <Stack spacing={1.5}>
        {loadingConnections ? (
          <CircularProgress size={20} />
        ) : connections.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('empty')}
          </Typography>
        ) : (
          connections.map((conn) => (
            <ConnectionRow
              key={conn.id}
              conn={conn}
              budgetName={budgetNameMap[conn.budgetProfileId] ?? t('unknownBudget')}
              onManageAccounts={() => handleManageAccounts(conn)}
              managingAccounts={managingAccountsId === conn.id}
              onDisconnect={() => setConfirmDisconnect(conn)}
              disconnecting={disconnectingId === conn.id}
            />
          ))
        )}

        <Button
          variant="outlined"
          startIcon={isFetchingToken ? <CircularProgress size={16} /> : <AccountBalanceIcon />}
          disabled={isFetchingToken}
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
        confirming={disconnectMutation.isPending}
        onConfirm={handleDisconnectConfirm}
        onClose={() => setConfirmDisconnect(null)}
      />
    </Box>
  )
}
