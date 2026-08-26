'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createRestClient } from '@/lib/api/rest'

/**
 * The authenticated REST client, memoised per token.
 *
 * The REST counterpart of `useClient`, and used the same way. Only for the
 * endpoints that actually need a token — anything public should use
 * `publicRestClient` directly, so the request stays cacheable by a shared cache
 * rather than looking user-specific.
 */
export function useRestClient() {
  const { token } = useAuth()
  return useMemo(() => createRestClient(token), [token])
}
