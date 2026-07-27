'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/gen/wellspent/v1/notification_connect'
import { useClient } from '@/hooks/useClient'
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
  const qc = useQueryClient()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  const { data: countData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => client.getUnreadCount({}),
    refetchInterval: 30_000,
  })
  const unreadCount = countData?.count ?? 0

  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications', budgetId ?? ''],
    queryFn: () => client.listNotifications({ budgetProfileId: budgetId ?? '', limit: 20 }),
    enabled: open,
  })

  const markAllMutation = useMutation({
    mutationFn: () => client.markNotificationsRead({ ids: [] }),
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
