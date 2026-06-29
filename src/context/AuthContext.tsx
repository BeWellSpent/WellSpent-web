'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TransportProvider } from '@connectrpc/connect-query'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { createTransport } from '@/lib/api/client'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'

interface AuthContextValue {
  token: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ token, children }: { token: string; children: React.ReactNode }) {
  const { showError } = useSnackbar()
  const transport = useMemo(() => createTransport(token), [token])

  // Keep a stable ref to showError so the QueryCache callback never goes stale
  const showErrorRef = useRef(showError)
  useEffect(() => { showErrorRef.current = showError }, [showError])

  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => showErrorRef.current(err),
    }),
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }))

  return (
    <AuthContext.Provider value={{ token }}>
      <TransportProvider transport={transport}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TransportProvider>
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
