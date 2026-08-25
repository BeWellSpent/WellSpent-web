'use client'

import { useQuery } from '@tanstack/react-query'
import { ChangelogService } from '@/gen/wellspent/v1/changelog_connect'
import { ChangelogComponent } from '@/gen/wellspent/v1/common_pb'
import type { ChangelogRelease } from '@/gen/wellspent/v1/changelog_pb'
import { useClient } from '@/hooks/useClient'

/** The web bundle's own version, as package.json spells it. */
export const WEB_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

/** Component keys for the per-component "last seen" record. */
export const WEB_COMPONENT = 'web'
export const SERVER_COMPONENT = 'server'

/**
 * The cache key. Deliberately not exported, unlike this codebase's other query
 * keys: those are exported so mutations can invalidate them, and nothing on the
 * client can mutate the changelog — releases are published server-side by
 * script. There is nothing to invalidate.
 *
 * Both readers — the what's-new prompt and the Help browser — go through this
 * hook, so they share the cache and opening Help costs no second round trip.
 */
function changelogQueryKey(components: ChangelogComponent[]) {
  return ['changelog', ...components] as const
}

export function useChangelog(components: ChangelogComponent[], enabled = true): {
  releases: ChangelogRelease[]
  serverVersion: string
  isLoading: boolean
} {
  const client = useClient(ChangelogService)

  const { data, isLoading } = useQuery({
    queryKey: changelogQueryKey(components),
    queryFn: () => client.listChangelog({ components }),
    enabled,
    // Release notes change when someone publishes, which is rare and never
    // urgent. Refetching on every window focus would be pure noise.
    staleTime: 5 * 60 * 1000,
  })

  return {
    releases: data?.releases ?? [],
    serverVersion: data?.currentServerVersion ?? '',
    isLoading,
  }
}

export function releasesFor(releases: ChangelogRelease[], component: ChangelogComponent): ChangelogRelease[] {
  return releases.filter((r) => r.component === component)
}
