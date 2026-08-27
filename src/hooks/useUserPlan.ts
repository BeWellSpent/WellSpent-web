'use client'

import { AccountPlan } from '@/gen/wellspent/v1/common_pb'
import { useMe } from '@/hooks/useMe'

function useUserPlan(): AccountPlan {
  const { user } = useMe()
  return user?.plan ?? AccountPlan.FREE
}

export function useIsFreeTier(): boolean {
  const plan = useUserPlan()
  return plan === AccountPlan.UNSPECIFIED || plan === AccountPlan.FREE
}
