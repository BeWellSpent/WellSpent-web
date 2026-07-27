'use client'

import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import type { AlertSubscription } from '@/gen/wellspent/v1/notification_pb'

type AlertType = 'new_transaction' | 'spending_threshold' | 'period_created' | 'review_pending'
type Channel = 'in_app' | 'email' | 'both'

interface Props {
  alertType: AlertType
  subscription: AlertSubscription | undefined
  isPending: boolean
  onEnable: (channel: Channel, thresholdPct?: number, thresholdScope?: string) => void
  onDisable: () => void
  onUpdate: (channel: Channel, thresholdPct?: number, thresholdScope?: string) => void
}

const THRESHOLD_MARKS = [
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100%' },
]

export function AlertTypeRow({ alertType, subscription, isPending, onEnable, onDisable, onUpdate }: Props) {
  const t = useTranslations('notifications.alerts')
  const enabled = !!subscription

  const channel = (subscription?.channel ?? 'in_app') as Channel
  const thresholdPct = subscription?.thresholdPct ?? 80
  const thresholdScope = subscription?.thresholdScope ?? 'budget'

  function handleToggle(checked: boolean) {
    if (checked) {
      const defaultThreshold = alertType === 'spending_threshold' ? 80 : 0
      onEnable(channel, defaultThreshold || undefined, thresholdScope)
    } else {
      onDisable()
    }
  }

  function handleChannelChange(newChannel: Channel) {
    if (enabled) onUpdate(newChannel, thresholdPct || undefined, thresholdScope)
  }

  function handleThresholdChange(value: number) {
    if (enabled) onUpdate(channel, value, thresholdScope)
  }

  function handleScopeChange(scope: string) {
    if (enabled) onUpdate(channel, thresholdPct || undefined, scope)
  }

  return (
    <Box sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={isPending}
            size="small"
          />
        }
        label={
          <Box>
            <Typography variant="body2" fontWeight={600}>{t(`types.${alertType}.label`)}</Typography>
            <Typography variant="caption" color="text.secondary">{t(`types.${alertType}.description`)}</Typography>
          </Box>
        }
        sx={{ mx: 0, alignItems: 'flex-start', gap: 1 }}
      />

      {enabled && (
        <Box sx={{ mt: 1.5, ml: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('channel')}</InputLabel>
            <Select
              value={channel}
              label={t('channel')}
              onChange={(e) => handleChannelChange(e.target.value as Channel)}
              disabled={isPending}
            >
              <MenuItem value="in_app">{t('channels.in_app')}</MenuItem>
              <MenuItem value="email">{t('channels.email')}</MenuItem>
              <MenuItem value="both">{t('channels.both')}</MenuItem>
            </Select>
          </FormControl>

          {alertType === 'spending_threshold' && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {t('threshold')}: {thresholdPct}%
              </Typography>
              <Slider
                value={thresholdPct}
                min={10}
                max={100}
                step={null}
                marks={THRESHOLD_MARKS}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}%`}
                onChange={(_, v) => handleThresholdChange(v as number)}
                disabled={isPending}
                sx={{ mt: 1, width: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 160, mt: 1 }}>
                <InputLabel>{t('scope')}</InputLabel>
                <Select
                  value={thresholdScope}
                  label={t('scope')}
                  onChange={(e) => handleScopeChange(e.target.value)}
                  disabled={isPending}
                >
                  <MenuItem value="budget">{t('scopes.budget')}</MenuItem>
                  <MenuItem value="category">{t('scopes.category')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
