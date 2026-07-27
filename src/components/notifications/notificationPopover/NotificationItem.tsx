'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Notification } from '@/gen/wellspent/v1/notification_pb'

interface Props {
  notification: Notification
}

function timeAgo(seconds: bigint): string {
  const diff = Date.now() - Number(seconds) * 1000
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationItem({ notification }: Props) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600} sx={{ flex: 1 }}>
          {notification.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {notification.createdAt ? timeAgo(notification.createdAt.seconds) : ''}
        </Typography>
      </Box>
      {notification.body && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {notification.body}
        </Typography>
      )}
    </Box>
  )
}
