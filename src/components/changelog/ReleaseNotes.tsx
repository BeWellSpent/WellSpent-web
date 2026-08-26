'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { ChangeType, ChangelogRelease } from '@/lib/api/restModels'
import { localizedSummary } from './announce'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface Props {
  releases: ChangelogRelease[]
}

/** Colour per change type. Semantic, and independent of the theme accent. */
const CHIP_COLOR: Record<ChangeType, 'success' | 'warning' | 'info'> = {
  added: 'success',
  fixed: 'warning',
  changed: 'info',
}

// The contract's change-type values are already the translation keys, so this
// is identity — kept as an explicit map so a fourth type added to the contract
// is a type error here rather than a silently missing chip label.
const CHIP_KEY: Record<ChangeType, string> = {
  added: 'added',
  fixed: 'fixed',
  changed: 'changed',
}

/**
 * A list of releases with their items. Shared by the what's-new dialog and the
 * Help browser so the two can't drift into rendering the same notes
 * differently.
 *
 * Items keep the order the operator wrote them in rather than being grouped by
 * type: a release usually reads as a short narrative, and re-sorting it into
 * buckets breaks that for the sake of tidiness nobody asked for.
 */
export function ReleaseNotes({ releases }: Props) {
  const t = useTranslations('changelog')
  const locale = useLocale()

  if (releases.length === 0) {
    return <Typography variant="body2" color="text.secondary">{t('empty')}</Typography>
  }

  return (
    <Stack spacing={2.5}>
      {releases.map((release) => (
        <Box key={release.id}>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.75 }}>
            <Typography variant="subtitle2" fontWeight={700}>{release.version}</Typography>
            {release.releasedAt && (
              <Typography variant="caption" color="text.secondary">
                {new Date(release.releasedAt).toLocaleDateString(locale, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </Typography>
            )}
          </Stack>
          <Stack spacing={0.75}>
            {release.items.map((item, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                <Chip
                  label={t(`type.${CHIP_KEY[item.changeType] ?? 'changed'}`)}
                  size="small"
                  color={CHIP_COLOR[item.changeType] ?? 'default'}
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', height: 20, flexShrink: 0, minWidth: 72 }}
                />
                <Typography variant="body2">
                  {localizedSummary(item.summaryEn, item.summaryEs, locale)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
