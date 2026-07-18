'use client'

import { useTranslations } from 'next-intl'
import type { PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import { statusColor } from './statusColor'
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

export function ConnectionRow({
  conn,
  budgetName,
  onManageAccounts,
  managingAccounts,
  onDisconnect,
  disconnecting,
}: {
  conn: PlaidConnection
  budgetName: string
  onManageAccounts: () => void
  managingAccounts: boolean
  onDisconnect: () => void
  disconnecting: boolean
}) {
  const t = useTranslations('settings.plaid')
  const name = conn.institutionName || t('unknownBank')
  const lastSynced = conn.lastSyncedAt
    ? new Date(Number(conn.lastSyncedAt.seconds) * 1000).toLocaleDateString()
    : t('neverSynced')
  const isConnected = conn.status !== 'disconnected'

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
        <Stack direction="row" spacing={1} alignItems="center">
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
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {budgetName} · {t('lastSynced', { date: lastSynced })}
        </Typography>
      </Stack>

      {isConnected && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('manageAccounts')}>
            <span>
              <IconButton
                size="small"
                onClick={onManageAccounts}
                disabled={managingAccounts || disconnecting}
              >
                {managingAccounts ? <CircularProgress size={16} /> : <ManageAccountsIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t('disconnect')}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={onDisconnect}
                disabled={disconnecting || managingAccounts}
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
