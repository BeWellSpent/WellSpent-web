const flags = {
  googleAuth: process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH === 'true',
  // Strangler-fig cutover switches (C# rewrite, issue #86): off by default so
  // merging a flip doesn't break production, where no C# backend is deployed.
  csharpAuth: process.env.NEXT_PUBLIC_FEATURE_CSHARP_AUTH === 'true',
  csharpStatusChangelog: process.env.NEXT_PUBLIC_FEATURE_CSHARP_STATUS_CHANGELOG === 'true',
  csharpUser: process.env.NEXT_PUBLIC_FEATURE_CSHARP_USER === 'true',
  csharpNotification: process.env.NEXT_PUBLIC_FEATURE_CSHARP_NOTIFICATION === 'true',
} as const

export type FeatureFlag = keyof typeof flags

export function isEnabled(flag: FeatureFlag): boolean {
  return flags[flag]
}
