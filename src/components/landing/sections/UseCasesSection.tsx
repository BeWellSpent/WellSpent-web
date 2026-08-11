'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import WorkIcon from '@mui/icons-material/Work'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { USE_CASE_CLIPS } from '../showcase/showcaseAssets'
import { ShowcaseFrame } from '../showcase/ShowcaseFrame'

const USE_CASES = [
  { icon: <FamilyRestroomIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item1Title', descKey: 'useCases.item1Desc', clip: USE_CASE_CLIPS[0] },
  { icon: <WorkIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item2Title', descKey: 'useCases.item2Desc', clip: USE_CASE_CLIPS[1] },
  { icon: <EmojiObjectsIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item3Title', descKey: 'useCases.item3Desc', clip: USE_CASE_CLIPS[2] },
] as const

export function UseCasesSection() {
  const t = useTranslations('landing')

  return (
    <Box id="use-cases" sx={{ ...SECTION_SX, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('useCases.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('useCases.subtitle')}
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {USE_CASES.map(({ icon, titleKey, descKey, clip }) => (
            <Grid item xs={12} md={4} key={titleKey}>
              <Box sx={{ textAlign: 'center' }}>
                {/* Falls back to the icon until the clip is recorded, so this
                    section degrades to its previous look rather than to a gap. */}
                <ShowcaseFrame
                  src={clip}
                  alt={t(titleKey)}
                  placeholderLabel={t(titleKey)}
                  aspectRatio="4 / 3"
                  fallback={<Box sx={{ color: 'secondary.main', display: 'flex' }}>{icon}</Box>}
                />
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2.5 }}>
                  {t(titleKey)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t(descKey)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
