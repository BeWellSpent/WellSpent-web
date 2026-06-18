'use client'

import { createContext, useContext, useMemo } from 'react'
import { TransportProvider } from '@connectrpc/connect-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTransport } from '@/lib/api/client'

interface AuthContextValue {
  token: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export function AuthProvider({ token, children }: { token: string; children: React.ReactNode }) {
  const transport = useMemo(() => createTransport(token), [token])

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
