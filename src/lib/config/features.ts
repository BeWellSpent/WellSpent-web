const flags = {
  googleAuth: process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH === 'true',
  // Strangler-fig cutover switch (C# rewrite, issue #86): off by default so
  // merging this doesn't break production, where no C# backend is deployed.
  csharpAuth: process.env.NEXT_PUBLIC_FEATURE_CSHARP_AUTH === 'true',
} as const

export type FeatureFlag = keyof typeof flags

export function isEnabled(flag: FeatureFlag): boolean {
  return flags[flag]
}
