'use client'

import { useQuery } from '@tanstack/react-query'
import { AccountPlan } from '@/gen/wellspent/v1/common_pb'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { useClient } from '@/hooks/useClient'

function useUserPlan(): AccountPlan {
  const client = useClient(UserService)
  const { data } = useQuery({
    queryKey: ['getMe'],
    queryFn: () => client.getMe({}),
  })
  return data?.user?.plan ?? AccountPlan.FREE
}

export function useIsFreeTier(): boolean {
  const plan = useUserPlan()
  return plan === AccountPlan.UNSPECIFIED || plan === AccountPlan.FREE
}
