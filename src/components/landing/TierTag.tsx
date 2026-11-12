import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import type { Tier } from './features/featureGroups'

const TIER_SX = {
  free: { bgcolor: 'rgba(11,122,75,0.12)', color: 'success.main' },
  limited: { bgcolor: 'rgba(201,122,10,0.14)', color: 'warning.main' },
  pro: { bgcolor: 'text.primary', color: 'background.paper' },
} as const

/** FREE, FREE · LIMITED or PRO, the same pill everywhere a feature's cost is shown. */
export function TierTag({ tier }: { tier: Tier }) {
  const t = useTranslations('landing.tiers')
  return (
    <Box
      component="span"
      sx={{
        ...TIER_SX[tier],
        flexShrink: 0,
        height: 24,
        px: '9px',
        borderRadius: '12px',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {t(tier)}
    </Box>
  )
}
