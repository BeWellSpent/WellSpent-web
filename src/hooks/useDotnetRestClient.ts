'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createDotnetRestClient } from '@/lib/api/rest'

/** Same shape as `useRestClient`, pointed at the new C# backend instead — see `rest.ts`'s doc comment. */
export function useDotnetRestClient() {
  const { token } = useAuth()
  return useMemo(() => createDotnetRestClient(token), [token])
}
