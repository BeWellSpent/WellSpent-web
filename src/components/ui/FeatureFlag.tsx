import { isEnabled, type FeatureFlag } from '@/lib/config/features'

interface Props {
  flag: FeatureFlag
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Feature({ flag, children, fallback = null }: Props) {
  return isEnabled(flag) ? <>{children}</> : <>{fallback}</>
}
