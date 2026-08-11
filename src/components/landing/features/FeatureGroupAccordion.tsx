'use client'

import type { ReactNode } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslations } from 'next-intl'
import type { FeatureGroup } from './featureGroups'

type Props = {
  group: FeatureGroup
  icon: ReactNode
}

/**
 * One collapsible feature group.
 *
 * Groups start expanded: the nav's Features dropdown scrolls straight to a
 * group, and landing on a collapsed header would show the visitor a title and
 * nothing else. Collapsing is there for skimming, not for hiding the content
 * by default.
 */
export function FeatureGroupAccordion({ group, icon }: Props) {
  const t = useTranslations('landing')
  const { key, id, items, comingSoon } = group

  return (
    <Accordion
      id={id}
      defaultExpanded={!comingSoon}
      disableGutters
      elevation={0}
      sx={{
        scrollMarginTop: '80px',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
        opacity: comingSoon ? 0.7 : 1,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { mb: 2 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2, minWidth: 0 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight={700}>
                {t(`featureGroups.${key}.title`)}
              </Typography>
              {comingSoon && (
                <Chip label={t('featureGroups.comingSoon')} size="small" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t(`featureGroups.${key}.summary`)}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      {items.length > 0 && (
        <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 0 }}>
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} key={item}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t(`featureGroups.${key}.items.${item}.title`)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t(`featureGroups.${key}.items.${item}.desc`)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      )}
    </Accordion>
  )
}
