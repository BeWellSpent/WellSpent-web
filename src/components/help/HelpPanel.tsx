'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChangelogComponent } from '@/gen/wellspent/v1/common_pb'
import { ReleaseNotes } from '@/components/changelog/ReleaseNotes'
import { releasesFor, useChangelog } from '@/components/changelog/useChangelog'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const COMPONENTS = [
  { value: ChangelogComponent.WEB, key: 'web' },
  { value: ChangelogComponent.IOS, key: 'ios' },
  { value: ChangelogComponent.SERVER, key: 'server' },
] as const

/**
 * Help — deliberately somewhere you have to go looking for, per the issue.
 *
 * For now it holds one thing: the full changelog, browsable per component
 * including iOS, which a web reader can't see any other way. Collapsed behind
 * an accordion so the settings page doesn't grow a wall of release history for
 * everyone who opens it.
 */
export function HelpPanel() {
  const t = useTranslations('help')
  const [tab, setTab] = useState(0)

  // Every component, not just this client's: the point of this browser is
  // history, including the platform you aren't currently on.
  const { releases, isLoading } = useChangelog([])
  const selected = COMPONENTS[tab]

  return (
    <Paper variant="outlined" sx={{ mt: 4 }}>
      <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
            <Typography variant="caption" color="text.secondary">{t('changelogSubtitle')}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Tabs
            value={tab}
            onChange={(_, v: number) => setTab(v)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {COMPONENTS.map((c) => (
              <Tab key={c.key} label={t(`component.${c.key}`)} />
            ))}
          </Tabs>
          {isLoading
            ? <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>
            : <ReleaseNotes releases={releasesFor(releases, selected.value)} />}
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}
