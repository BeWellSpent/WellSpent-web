'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/gen/wellspent/v1/notification_connect'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import { notificationFromRest } from '@/lib/notifications/notificationTransport'
import { isEnabled } from '@/lib/config/features'
import { NotificationItem } from './notificationPopover/NotificationItem'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import NotificationsIcon from '@mui/icons-material/Notifications'

interface Props {
  budgetId?: string
}

export function NotificationBell({ budgetId }: Props) {
  const t = useTranslations('notifications')
  const client = useClient(NotificationService)
  const dotnetClient = useDotnetRestClient()
  const qc = useQueryClient()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  // No refetchInterval: this used to poll every 30s unconditionally, which
  // defeats Neon's scale-to-zero — one forgotten open tab keeps the compute
  // active around the clock, well past what a budgeting app's unread badge
  // is worth in real-time freshness. Refetching on window focus (the
  // TanStack Query default, not overridden anywhere in this app) plus the
  // app-wide 30s staleTime (AuthContext) already updates the badge whenever
  // someone actually returns to the tab — which is the only time anyone
  // looks at it.
  const { data: countData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      if (isEnabled('csharpNotification')) {
        // The REST endpoint merges list+count into one response — global unread
        // count is independent of `limit`, so limit=1 keeps this query cheap,
        // matching Connect's separate (unscoped, always-on) getUnreadCount RPC.
        const res = unwrap(await dotnetClient.GET('/rest/v1/notifications', { params: { query: { limit: 1 } } }))
        return { count: res.unreadCount }
      }
      return client.getUnreadCount({})
    },
  })
  const unreadCount = countData?.count ?? 0

  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications', budgetId ?? ''],
    queryFn: async () => {
      if (isEnabled('csharpNotification')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/notifications', { params: { query: { budgetProfileId: budgetId, limit: 20 } } }))
        return { notifications: res.notifications.map(notificationFromRest) }
      }
      return client.listNotifications({ budgetProfileId: budgetId ?? '', limit: 20 })
    },
    enabled: open,
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (isEnabled('csharpNotification')) {
        // No response body on success — unwrap() assumes a body is always
        // present on 2xx, so check the error field directly.
        const { error } = await dotnetClient.POST('/rest/v1/notifications/mark-read', { body: { ids: [] } })
        if (error) throw new Error(error.message)
        return
      }
      await client.markNotificationsRead({ ids: [] })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-unread-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  function handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(e.currentTarget)
  }

  function handleClose() {
    setAnchorEl(null)
  }

  const notifications = listData?.notifications ?? []

  return (
    <>
      <Tooltip title={t('title')} placement="right">
        <IconButton onClick={handleOpen} size="small" aria-label={t('title')}>
          <Badge badgeContent={unreadCount || undefined} color="error" max={99}>
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 480 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>{t('title')}</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              {t('markAllRead')}
            </Button>
          )}
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{t('empty')}</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', maxHeight: 380 }}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </Box>
        )}
      </Popover>
    </>
  )
}
