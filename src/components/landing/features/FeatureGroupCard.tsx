'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useTranslations } from 'next-intl'
import type { FeatureGroup } from './featureGroups'

type Props = {
  group: FeatureGroup
  href: string
  icon: ReactNode
}

/** One group on the features index, linking through to its own page. */
export function FeatureGroupCard({ group, href, icon }: Props) {
  const t = useTranslations('landing')

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        opacity: group.comingSoon ? 0.75 : 1,
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea component={NextLink} href={href} sx={{ height: '100%', p: 3, alignItems: 'flex-start' }}>
        <Box sx={{ color: 'primary.main', mb: 1.5, display: 'flex' }}>{icon}</Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Typography variant="h6" fontWeight={700}>
            {t(`featureGroups.${group.key}.title`)}
          </Typography>
          {group.comingSoon && <Chip label={t('featureGroups.comingSoon')} size="small" variant="outlined" />}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
          {t(`featureGroups.${group.key}.summary`)}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 600 }}>
          <Typography variant="button" sx={{ textTransform: 'none' }}>
            {t('features.explore')}
          </Typography>
          <ArrowForwardIcon fontSize="small" />
        </Box>
      </CardActionArea>
    </Card>
  )
}
