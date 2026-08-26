'use client'

import { useCallback, useEffect, useState } from 'react'
import { publicRestClient, unwrap } from '@/lib/api/rest'
import type { StatusBanner } from '@/lib/api/restModels'
import { browserStorage, isDismissed, markDismissed } from './dismissal'

/**
 * How often to re-check. Long enough not to be chatty on an idle tab, short
 * enough that a banner posted mid-incident reaches someone who left the app
 * open. A focus listener covers the "came back to the tab" case faster.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000

/**
 * Fetches the active status banner and tracks whether the reader has closed it.
 *
 * Deliberately not TanStack Query: `QueryClientProvider` lives inside
 * `AuthContext`, which doesn't exist on the landing or login pages — and those
 * are half the point of a banner that has to work during an outage.
 *
 * Served over REST rather than Connect so the response is genuinely cacheable.
 * It carries `public, max-age=30` and an ETag, so the poll below mostly costs a
 * conditional request answered with a 304 — including the "nothing is live"
 * case, which is almost always the answer.
 */
export function useStatusBanner() {
  const [banner, setBanner] = useState<StatusBanner | null>(null)
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = unwrap(await publicRestClient.GET('/rest/v1/status/banner'))
      setBanner(res.banner ?? null)
    } catch {
      // Swallowed on purpose. This is decoration on top of every page,
      // including pages that work fine without it — an unreachable backend
      // must not surface an error here, and there is nothing the reader
      // could do about it anyway.
      setBanner(null)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  // Read after mount, never during render: localStorage isn't available on the
  // server, and reading it in the render pass would hydrate differently than
  // it rendered.
  useEffect(() => {
    if (!banner) return
    if (isDismissed(browserStorage(), banner.id)) setDismissedId(banner.id)
  }, [banner])

  const dismiss = useCallback(() => {
    if (!banner) return
    markDismissed(browserStorage(), banner.id)
    setDismissedId(banner.id)
  }, [banner])

  const visible = banner && banner.id !== dismissedId ? banner : null

  return { banner: visible, dismiss }
}
