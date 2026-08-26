'use client'

import { useEffect, useState } from 'react'
import { publicRestClient, unwrap } from '@/lib/api/rest'
import { logger } from '@/lib/logger'

export type CountryOption = { code: string; name: string }

/**
 * The country list, for the pickers on the registration form and the profile
 * editor.
 *
 * Both screens previously fetched and reshaped this themselves, character for
 * character. Extracted rather than migrated twice, per this repo's
 * "extract before you duplicate" rule.
 *
 * Uses the public client even on the authenticated profile screen: the endpoint
 * takes no token, and sending one would make the response look user-specific to
 * a cache that has no way to know it isn't.
 *
 * Not TanStack Query — `RegisterForm` renders above `AuthContext`, where
 * `QueryClientProvider` doesn't exist. The browser's own HTTP cache is doing
 * the real work here anyway: the response is `public, max-age=86400`, so the
 * second visit never reaches the network.
 */
export function useCountries(): { countries: CountryOption[]; isLoading: boolean } {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    publicRestClient
      .GET('/rest/v1/countries')
      .then((res) => {
        if (cancelled) return
        setCountries(unwrap(res).countries.map((c) => ({ code: c.code, name: c.name })))
      })
      .catch((err: unknown) => {
        logger.error('countries.list.failed', { error: err instanceof Error ? err.message : String(err) })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { countries, isLoading }
}
