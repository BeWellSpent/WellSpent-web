'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlaidService } from '@/gen/wellspent/v1/plaid_connect'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { useClient } from '@/hooks/useClient'
import { paymentMethodsQueryKey } from '@/hooks/usePaymentMethods'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'

/**
 * A fresh connect exchanges the returned public_token for a new item.
 * An update-mode session (account selection on an existing item) doesn't
 * return a usable public_token — Link still calls onSuccess, but the right
 * follow-up is to re-sync the connection's account list, not exchange.
 */
type LinkSession =
  | { mode: 'connect'; token: string; budgetProfileId: string }
  | { mode: 'update'; token: string; connectionId: string }

/**
 * Everything two screens need to show and act on Plaid connections.
 *
 * Settings lists a user's connections across every budget; a budget's manage
 * view lists every member's connections on one budget. The list differs, but
 * the Link session handling and all five mutations are identical — so they
 * live here rather than being written twice and drifting.
 *
 * Pass a `budgetProfileId` to scope the query to one budget; omit it for the
 * caller's own connections everywhere.
 */
export function usePlaidConnections(budgetProfileId?: string) {
  const { showError } = useSnackbar()
  const queryClient = useQueryClient()
  const plaidClient = useClient(PlaidService)

  const [linkSession, setLinkSession] = useState<LinkSession | null>(null)
  const [managingAccountsId, setManagingAccountsId] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [resyncingId, setResyncingId] = useState<string | null>(null)

  const queryKey = ['plaidConnections', budgetProfileId ?? 'all']

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => plaidClient.getPlaidConnections(budgetProfileId ? { budgetProfileId } : {}),
  })

  /**
   * Both scopes are invalidated on every mutation: the same connection appears
   * in the user's own list and in its budget's list, so refreshing only the
   * one on screen leaves the other stale behind the user's back.
   */
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['plaidConnections'] })
  }, [queryClient])

  const createTokenMutation = useMutation({
    mutationFn: (targetBudgetId: string) =>
      plaidClient.createLinkToken({ budgetProfileId: targetBudgetId }),
  })

  const createUpdateTokenMutation = useMutation({
    mutationFn: (args: { budgetProfileId: string; connectionId: string }) =>
      plaidClient.createLinkToken(args),
  })

  const exchangeMutation = useMutation({
    mutationFn: ({ publicToken, budgetProfileId: target }: { publicToken: string; budgetProfileId: string }) =>
      plaidClient.exchangePublicToken({ publicToken, budgetProfileId: target }),
    onSuccess: () => {
      invalidate()
      logger.info('plaid.connect.success')
    },
  })

  const refreshAccountsMutation = useMutation({
    mutationFn: (connectionId: string) => plaidClient.refreshPlaidAccounts({ connectionId }),
    onSuccess: (res) => {
      invalidate()
      if (res.connection?.budgetProfileId) {
        queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey(res.connection.budgetProfileId) })
      }
      logger.info('plaid.refreshAccounts.success')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => plaidClient.disconnectPlaid({ connectionId }),
    onSuccess: () => {
      invalidate()
      logger.info('plaid.disconnect.success')
    },
  })

  const resyncMutation = useMutation({
    mutationFn: (connectionId: string) => plaidClient.resyncPlaidConnection({ connectionId }),
    onSuccess: () => {
      invalidate()
      logger.info('plaid.resync.success')
    },
  })

  const startConnect = useCallback(
    async (targetBudgetId: string) => {
      try {
        const res = await createTokenMutation.mutateAsync(targetBudgetId)
        setLinkSession({ mode: 'connect', token: res.linkToken, budgetProfileId: targetBudgetId })
      } catch (err) {
        showError(err)
      }
    },
    [createTokenMutation, showError],
  )

  const startManageAccounts = useCallback(
    async (conn: PlaidConnection) => {
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
    },
    [createUpdateTokenMutation, showError],
  )

  const handleLinkSuccess = useCallback(
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

  const handleLinkExit = useCallback(() => {
    setLinkSession(null)
    setManagingAccountsId(null)
  }, [])

  const disconnect = useCallback(
    async (connectionId: string) => {
      setDisconnectingId(connectionId)
      try {
        await disconnectMutation.mutateAsync(connectionId)
      } catch (err) {
        showError(err)
      } finally {
        setDisconnectingId(null)
      }
    },
    [disconnectMutation, showError],
  )

  const resync = useCallback(
    async (connectionId: string) => {
      setResyncingId(connectionId)
      try {
        await resyncMutation.mutateAsync(connectionId)
      } catch (err) {
        showError(err)
      } finally {
        setResyncingId(null)
      }
    },
    [resyncMutation, showError],
  )

  return {
    connections: data?.connections ?? [],
    syncWarnings: data?.warnings ?? [],
    isLoading,
    linkSession,
    startConnect,
    startManageAccounts,
    handleLinkSuccess,
    handleLinkExit,
    disconnect,
    resync,
    managingAccountsId,
    disconnectingId,
    resyncingId,
    isConnecting: createTokenMutation.isPending || exchangeMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  }
}
