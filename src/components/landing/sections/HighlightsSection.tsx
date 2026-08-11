'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { SHOWCASE } from '../showcase/showcaseAssets'
import { ShowcaseFrame } from '../showcase/ShowcaseFrame'

/**
 * The two things that most distinguish WellSpent from a spreadsheet, and that
 * a grid of feature cards buries: a budget is shared by invitation rather than
 * owned by one person, and imported bank transactions match themselves against
 * the fixed expenses you already planned.
 */
const HIGHLIGHTS = [
  { key: 'shared', src: SHOWCASE.people, icon: <GroupAddIcon /> },
  { key: 'matching', src: SHOWCASE.review, icon: <AutoAwesomeIcon /> },
] as const

export function HighlightsSection() {
  const t = useTranslations('landing')

  return (
    <Box sx={{ ...SECTION_SX, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('highlights.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
            {t('highlights.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 5, md: 4 }}>
          {HIGHLIGHTS.map(({ key, src, icon }) => (
            <Grid item xs={12} md={6} key={key}>
              <ShowcaseFrame
                src={src}
                alt={t(`highlights.items.${key}.title`)}
                placeholderLabel={t(`highlights.items.${key}.title`)}
              />
              <Box sx={{ mt: 3 }}>
                <Chip
                  icon={icon}
                  label={t(`highlights.items.${key}.tag`)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1.5, fontWeight: 600 }}
                />
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {t(`highlights.items.${key}.title`)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {t(`highlights.items.${key}.desc`)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
