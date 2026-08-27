'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import type { User } from '@/gen/wellspent/v1/user_pb'
import { useClient } from '@/hooks/useClient'

/**
 * The one cache key for the signed-in user.
 *
 * There used to be two — `['getMe']` (the verification gate, the plan hook,
 * the change-email form) and `['me']` (profile settings, budget setup) — for
 * the same RPC, so saving a profile refreshed one half of the app and left the
 * other reading a stale user. That is the same defect `usePaymentMethods`
 * documents, and it is load-bearing here: the profile-completion gate reads
 * this user, and the form that dismisses the gate writes it. Split the key and
 * the gate never goes away.
 *
 * Import this rather than writing the key out again.
 */
export const ME_QUERY_KEY = ['getMe'] as const

export function useMe(options?: { refetchOnWindowFocus?: boolean; staleTime?: number }): {
  user: User | undefined
  isLoading: boolean
} {
  const client = useClient(UserService)

  const { data, isLoading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => client.getMe({}),
    ...options,
  })

  return { user: data?.user, isLoading }
}
