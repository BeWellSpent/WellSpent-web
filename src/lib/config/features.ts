const flags = {
  googleAuth: process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH === 'true',
} as const

export type FeatureFlag = keyof typeof flags

export function isEnabled(flag: FeatureFlag): boolean {
  return flags[flag]
}
