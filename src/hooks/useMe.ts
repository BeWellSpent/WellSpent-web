'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { User } from '@/gen/wellspent/v1/user_pb'
import { AccountPlan, FilingStatus, TaxPaymentFrequency } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { unwrap } from '@/lib/api/rest'
import type { components } from '@/gen/rest/schema'
import { isEnabled } from '@/lib/config/features'

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

const PLAN_FROM_REST: Record<components['schemas']['UserPlan'], AccountPlan> = {
  free: AccountPlan.FREE,
  pro: AccountPlan.PRO,
  lifetime: AccountPlan.LIFETIME,
}

/** Normalizes the C# backend's REST `User` into the same proto `User` shape every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
function userFromRest(dto: components['schemas']['User']): User {
  return new User({
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    isActive: dto.isActive,
    isVerified: dto.isVerified,
    countryCode: dto.countryCode ?? '',
    stateCode: dto.stateCode ?? '',
    filingStatus: dto.filingStatus as FilingStatus,
    taxPaymentFrequency: dto.taxPaymentFrequency as TaxPaymentFrequency,
    language: dto.language,
    currency: dto.currency,
    plan: PLAN_FROM_REST[dto.plan],
    hasApplePrivateEmail: dto.hasApplePrivateEmail,
  })
}

export function useMe(options?: { refetchOnWindowFocus?: boolean; staleTime?: number }): {
  user: User | undefined
  isLoading: boolean
} {
  const connectClient = useClient(UserService)
  const dotnetClient = useDotnetRestClient()

  const { data, isLoading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      if (isEnabled('csharpUser')) {
        const res = unwrap(await dotnetClient.GET('/rest/v1/users/me'))
        return userFromRest(res.user)
      }
      const res = await connectClient.getMe({})
      return res.user
    },
    ...options,
  })

  return { user: data, isLoading }
}
