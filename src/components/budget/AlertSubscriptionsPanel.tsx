'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/gen/wellspent/v1/notification_connect'
import { useClient } from '@/hooks/useClient'
import { AlertTypeRow } from './alertSubscriptionsPanel/AlertTypeRow'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import type { AlertSubscription } from '@/gen/wellspent/v1/notification_pb'

interface Props {
  budgetProfileId: string
}

type AlertType = 'new_transaction' | 'spending_threshold' | 'period_created' | 'review_pending'
type Channel = 'in_app' | 'email' | 'both'

const ALERT_TYPES: AlertType[] = ['new_transaction', 'spending_threshold', 'period_created', 'review_pending']

export function AlertSubscriptionsPanel({ budgetProfileId }: Props) {
  const t = useTranslations('notifications.alerts')
  const client = useClient(NotificationService)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alert-subscriptions', budgetProfileId],
    queryFn: () => client.listAlertSubscriptions({ budgetProfileId }),
  })

  const upsertMutation = useMutation({
    mutationFn: (vars: {
      alertType: string
      channel: string
      thresholdPct?: number
      thresholdScope?: string
    }) =>
      client.upsertAlertSubscription({
        budgetProfileId,
        alertType: vars.alertType,
        channel: vars.channel,
        thresholdPct: vars.thresholdPct ?? 0,
        thresholdScope: vars.thresholdScope ?? '',
        notifyAllMembers: false,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-subscriptions', budgetProfileId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.deleteAlertSubscription({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-subscriptions', budgetProfileId] }),
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  const subsByType = new Map<string, AlertSubscription>()
  for (const sub of data?.subscriptions ?? []) {
    subsByType.set(sub.alertType, sub)
  }

  const isPending = upsertMutation.isPending || deleteMutation.isPending

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('description')}
      </Typography>

      {ALERT_TYPES.map((alertType) => (
        <AlertTypeRow
          key={alertType}
          alertType={alertType}
          subscription={subsByType.get(alertType)}
          isPending={isPending}
          onEnable={(channel, thresholdPct, thresholdScope) =>
            upsertMutation.mutate({ alertType, channel, thresholdPct, thresholdScope })
          }
          onDisable={() => {
            const sub = subsByType.get(alertType)
            if (sub) deleteMutation.mutate(sub.id)
          }}
          onUpdate={(channel, thresholdPct, thresholdScope) =>
            upsertMutation.mutate({ alertType, channel, thresholdPct, thresholdScope })
          }
        />
      ))}
    </Box>
  )
}
