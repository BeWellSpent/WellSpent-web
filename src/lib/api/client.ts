import { createConnectTransport } from '@connectrpc/connect-web'
import type { Transport } from '@connectrpc/connect'

export function createTransport(token: string): Transport {
  return createConnectTransport({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
    interceptors: [
      (next) => (req) => {
        req.header.set('Authorization', `Bearer ${token}`)
        return next(req)
      },
    ],
  })
}

// Unauthenticated transport for login / register
export const publicTransport: Transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
})
