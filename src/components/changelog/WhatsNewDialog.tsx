'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import { browserStorage } from '@/components/status/dismissal'
import { releasesToAnnounce } from './announce'
import { lastSeenVersion, markSeen } from './seenVersions'
import { ReleaseNotes } from './ReleaseNotes'
import { SERVER_COMPONENT, WEB_COMPONENT, WEB_VERSION, releasesFor, useChangelog } from './useChangelog'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/**
 * "What's new", shown the first time a reader opens a version.
 *
 * Two sections: this client, and the server behind it. They are separate
 * because they ship independently — a web release and a backend release have
 * different version numbers and land on different days, and merging them would
 * make it impossible to tell which one changed what.
 *
 * Nothing is shown on a first-ever run: the versions are recorded as seen and
 * the reader is left alone. See `releasesToAnnounce`.
 */
export function WhatsNewDialog() {
  const t = useTranslations('changelog')
  const isMobile = useIsMobile()
  const [dismissed, setDismissed] = useState(false)

  const { releases, serverVersion, isLoading } = useChangelog([
    WEB_COMPONENT,
    SERVER_COMPONENT,
  ])

  const storage = useMemo(() => browserStorage(), [])

  // Read once, before anything is marked seen — otherwise the effect below
  // would immediately erase what we are about to compare against.
  const [seen] = useState(() => ({
    web: lastSeenVersion(browserStorage(), WEB_COMPONENT),
    server: lastSeenVersion(browserStorage(), SERVER_COMPONENT),
  }))

  const webReleases = releasesToAnnounce(
    releasesFor(releases, WEB_COMPONENT), WEB_VERSION, seen.web,
  )
  const serverReleases = releasesToAnnounce(
    releasesFor(releases, SERVER_COMPONENT), serverVersion, seen.server,
  )

  // Record what this reader is on as soon as we know it, whether or not
  // anything is announced. A first-ever run has to be recorded too, or the
  // next load would treat it as first-ever again and never announce anything.
  useEffect(() => {
    if (isLoading) return
    markSeen(storage, WEB_COMPONENT, WEB_VERSION)
    if (serverVersion) markSeen(storage, SERVER_COMPONENT, serverVersion)
  }, [isLoading, serverVersion, storage])

  const hasSomethingToSay = webReleases.length > 0 || serverReleases.length > 0
  if (isLoading || dismissed || !hasSomethingToSay) return null

  return (
    <Dialog open fullScreen={isMobile} maxWidth="sm" fullWidth onClose={() => setDismissed(true)}>
      <DialogTitle>{t('whatsNew')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {webReleases.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">{t('component.web')}</Typography>
              <ReleaseNotes releases={webReleases} />
            </Stack>
          )}
          {webReleases.length > 0 && serverReleases.length > 0 && <Divider />}
          {serverReleases.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">{t('component.server')}</Typography>
              <ReleaseNotes releases={serverReleases} />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => setDismissed(true)}>{t('gotIt')}</Button>
      </DialogActions>
    </Dialog>
  )
}
