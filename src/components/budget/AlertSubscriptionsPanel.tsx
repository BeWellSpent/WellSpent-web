'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/gen/wellspent/v1/notification_connect'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { useCategories } from '@/hooks/useCategories'
import { useIsFreeTier } from '@/hooks/useUserPlan'
import { unwrap } from '@/lib/api/rest'
import { alertSubscriptionFromRest } from '@/lib/notifications/notificationTransport'
import { isEnabled as isFeatureEnabled } from '@/lib/config/features'
import { AlertTypeRow } from './alertSubscriptionsPanel/AlertTypeRow'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import type { AlertSubscription } from '@/gen/wellspent/v1/notification_pb'

interface Props {
  budgetProfileId: string
}

type AlertType = 'new_transaction' | 'spending_threshold' | 'period_created' | 'review_pending'
type Channel = 'in_app' | 'email' | 'both'

const ALL_ALERT_TYPES: AlertType[] = ['new_transaction', 'spending_threshold', 'period_created', 'review_pending']
const FREE_ALERT_TYPES: AlertType[] = ['spending_threshold', 'period_created', 'review_pending']

export function AlertSubscriptionsPanel({ budgetProfileId }: Props) {
  const t = useTranslations('notifications.alerts')
  const isFree = useIsFreeTier()
  const client = useClient(NotificationService)
  const dotnetClient = useDotnetRestClient()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alert-subscriptions', budgetProfileId],
    queryFn: async () => {
      if (isFeatureEnabled('csharpNotification')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/notifications/alert-subscriptions', { params: { query: { budgetProfileId } } }))
        return { subscriptions: res.subscriptions.map(alertSubscriptionFromRest) }
      }
      return client.listAlertSubscriptions({ budgetProfileId })
    },
  })

  const { categories } = useCategories(budgetProfileId)

  const upsertMutation = useMutation({
    mutationFn: async (vars: {
      alertType: string
      channel: string
      thresholdPct?: number
      thresholdScope?: string
      categoryId?: number
    }) => {
      if (isFeatureEnabled('csharpNotification')) {
        return unwrap(await dotnetClient.PUT('/rest/v1/notifications/alert-subscriptions', {
          body: {
            budgetProfileId,
            alertType: vars.alertType,
            channel: vars.channel,
            thresholdPct: vars.thresholdPct ?? 0,
            thresholdScope: vars.thresholdScope ?? '',
            categoryId: vars.categoryId ?? null,
            notifyAllMembers: false,
          },
        }))
      }
      return client.upsertAlertSubscription({
        budgetProfileId,
        alertType: vars.alertType,
        channel: vars.channel,
        thresholdPct: vars.thresholdPct ?? 0,
        thresholdScope: vars.thresholdScope ?? '',
        categoryId: vars.categoryId ?? 0,
        notifyAllMembers: false,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert-subscriptions', budgetProfileId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isFeatureEnabled('csharpNotification')) {
        const { error } = await dotnetClient.DELETE('/rest/v1/notifications/alert-subscriptions/{id}', { params: { path: { id } } })
        if (error) throw new Error(error.message)
        return
      }
      await client.deleteAlertSubscription({ id })
    },
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
  const alertTypes = isFree ? FREE_ALERT_TYPES : ALL_ALERT_TYPES
  const activeSubCount = (data?.subscriptions ?? []).length
  // Free-tier: block enabling a 3rd subscription type (updates to existing ones are always allowed)
  const isAtSubLimit = isFree && activeSubCount >= 2

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('description')}
      </Typography>

      {isFree && (
        <Chip
          label={t('freeTierNote')}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}

      {alertTypes.map((alertType) => {
        const isEnabled = !!subsByType.get(alertType)
        const isLocked = isAtSubLimit && !isEnabled
        return (
          <AlertTypeRow
            key={alertType}
            alertType={alertType}
            subscription={subsByType.get(alertType)}
            categories={categories}
            isPending={isPending || isLocked}
            onEnable={(channel, thresholdPct, thresholdScope, categoryId) =>
              upsertMutation.mutate({ alertType, channel, thresholdPct, thresholdScope, categoryId })
            }
            onDisable={() => {
              const sub = subsByType.get(alertType)
              if (sub) deleteMutation.mutate(sub.id)
            }}
            onUpdate={(channel, thresholdPct, thresholdScope, categoryId) =>
              upsertMutation.mutate({ alertType, channel, thresholdPct, thresholdScope, categoryId })
            }
          />
        )
      })}
    </Box>
  )
}
