'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import BarChartIcon from '@mui/icons-material/BarChart'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { FEATURE_GROUPS } from '../features/featureGroups'
import { FeatureGroupAccordion } from '../features/FeatureGroupAccordion'

/**
 * Icons live here rather than in `featureGroups.ts` so that file stays plain
 * data — the nav dropdown imports it and has no use for JSX.
 */
const GROUP_ICONS: Record<string, ReactNode> = {
  plan: <DonutLargeIcon />,
  transactions: <ReceiptLongIcon />,
  reports: <BarChartIcon />,
  budget: <AccountBalanceWalletIcon />,
}

export function FeaturesSection() {
  const t = useTranslations('landing')

  return (
    <Box id="features" sx={{ ...SECTION_SX, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('features.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('features.subtitle')}
          </Typography>
        </Box>

        {FEATURE_GROUPS.map((group) => (
          <FeatureGroupAccordion key={group.key} group={group} icon={GROUP_ICONS[group.key]} />
        ))}
      </Container>
    </Box>
  )
}
