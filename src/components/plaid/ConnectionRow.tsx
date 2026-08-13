'use client'

import { useTranslations } from 'next-intl'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { statusColor } from './statusColor'
import { resyncBlockedReason, hoursUntilResync } from './resyncCooldown'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SyncIcon from '@mui/icons-material/Sync'

/**
 * One bank connection.
 *
 * `subtitle` is what differs between the two screens that use this: Settings
 * lists a user's connections across budgets and captions each with its budget;
 * a budget's manage view lists every member's and captions each with its
 * owner. Everything else — status, actions, ownership gating — is identical.
 */
export function ConnectionRow({
  conn,
  subtitle,
  onManageAccounts,
  managingAccounts,
  manageAccountsDisabled,
  onDisconnect,
  disconnecting,
  onResync,
  resyncing,
}: {
  conn: PlaidConnection
  subtitle: string
  onManageAccounts: () => void
  managingAccounts: boolean
  manageAccountsDisabled?: boolean
  onDisconnect: () => void
  disconnecting: boolean
  onResync: () => void
  resyncing: boolean
}) {
  const t = useTranslations('plaid')
  const name = conn.institutionName || t('unknownBank')
  const lastSynced = conn.lastSyncedAt
    ? new Date(Number(conn.lastSyncedAt.seconds) * 1000).toLocaleDateString()
    : t('neverSynced')
  const isConnected = conn.status !== 'disconnected'
  const blockedReason = resyncBlockedReason(conn)
  const busy = managingAccounts || disconnecting || resyncing

  const resyncTooltip =
    blockedReason === 'cooldown'
      ? t('resyncCooldown', { hours: hoursUntilResync(conn) })
      : blockedReason === 'syncDisabled'
        ? t('resyncSyncDisabled')
        : blockedReason === 'notOwner'
          ? t('notYours')
          : t('resync')

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        px: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        gap: 1,
      }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <AccountBalanceIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600} noWrap>
            {name}
          </Typography>
          <Chip
            label={t(`status.${conn.status}`) || conn.status}
            color={statusColor(conn.status)}
            size="small"
            sx={{ height: 18, fontSize: 10 }}
          />
          {/* A connection whose owner isn't on a paid plan is a healthy link
              that imports nothing, so the status chip alone reads as fine. */}
          {isConnected && !conn.syncEnabled && (
            <Chip
              label={t('notSyncing')}
              color="warning"
              variant="outlined"
              size="small"
              sx={{ height: 18, fontSize: 10 }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {subtitle} · {t('lastSynced', { date: lastSynced })}
        </Typography>
      </Stack>

      {isConnected && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={resyncTooltip}>
            <span>
              <IconButton
                size="small"
                onClick={onResync}
                disabled={busy || blockedReason !== null}
                aria-label={t('resync')}
              >
                {resyncing ? <CircularProgress size={16} /> : <SyncIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={conn.isOwner ? t('manageAccounts') : t('notYours')}>
            <span>
              <IconButton
                size="small"
                onClick={onManageAccounts}
                disabled={busy || manageAccountsDisabled || !conn.isOwner}
                aria-label={t('manageAccounts')}
              >
                {managingAccounts ? <CircularProgress size={16} /> : <ManageAccountsIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={conn.isOwner ? t('disconnect') : t('notYours')}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={onDisconnect}
                disabled={busy || !conn.isOwner}
                aria-label={t('disconnect')}
              >
                {disconnecting ? <CircularProgress size={16} /> : <LinkOffIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )}
    </Box>
  )
}
