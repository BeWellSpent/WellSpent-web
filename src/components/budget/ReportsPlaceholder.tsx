'use client'

import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import BarChartIcon from '@mui/icons-material/BarChart'
import { AdBanner } from '@/components/ads/AdBanner'

export function ReportsPlaceholder() {
  const t = useTranslations('budget.reports')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <BarChartIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h6" fontWeight={700}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {t('description')}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {t('comingSoon')}
        </Typography>
      </Paper>

      {/* Ads are shown only to free-tier users — AdBanner self-suppresses for paid plans */}
      <AdBanner format="rectangle" style={{ minHeight: 250 }} />
    </Box>
  )
}
