import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from '@/gen/rest/schema'

/**
 * Client for the REST half of the API — the endpoints that are global and
 * rarely-changing, and therefore worth letting the browser cache.
 *
 * The counterpart of `client.ts`, deliberately shaped the same way: a
 * `createRestClient(token)` for authenticated callers and a `publicRestClient`
 * for everything above the auth boundary. Everything else in the API is still
 * ConnectRPC; see WellSpent-proto's `openapi/README.md` for what belongs here.
 *
 * Note that `fetch` handles the caching itself. These responses carry
 * `Cache-Control` and `ETag`, so the browser revalidates and serves 304s
 * without any of it being visible in this file — which is the entire reason
 * these endpoints left Connect's unary-POST framing.
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

/** The error body every non-2xx response carries, per the contract. */
export type RestError = { code: string; message: string }

/**
 * Thrown by `unwrap` so callers can use ordinary try/catch, matching how the
 * Connect client behaves. `openapi-fetch` returns errors rather than throwing,
 * which is better for exhaustive handling but would mean rewriting every call
 * site's control flow for no benefit.
 *
 * Not exported: nothing narrows on it yet, and an export nothing imports is
 * what `npx knip` exists to catch. Export it when a call site needs to tell a
 * 404 from a 500.
 */
class RestRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body?: RestError) {
    super(body?.message ?? `request failed with status ${status}`)
    this.name = 'RestRequestError'
    this.status = status
    this.code = body?.code ?? 'unknown'
  }
}

/**
 * Narrows an `openapi-fetch` result to its data, throwing on failure.
 *
 * `data` is only `undefined` when `error` is set, but TypeScript cannot see
 * that across the union, so this is also what makes call sites type cleanly.
 */
export function unwrap<T>(result: { data?: T; error?: RestError; response: Response }): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new RestRequestError(result.response.status, result.error)
  }
  return result.data
}

const authMiddleware = (token: string): Middleware => ({
  onRequest({ request }) {
    request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
  async onResponse({ response }) {
    // Mirrors the Connect transport's Unauthenticated interceptor: an expired
    // token must drop the session rather than leaving the user on a page whose
    // data silently stopped loading.
    if (response.status === 401) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      const locale = window.location.pathname.split('/')[1]
      window.location.href = ['en', 'es'].includes(locale) ? `/${locale}/login` : '/login'
    }
    return response
  },
})

export function createRestClient(token: string) {
  const client = createClient<paths>({ baseUrl })
  client.use(authMiddleware(token))
  return client
}

/**
 * Unauthenticated client, for the endpoints that must work with no session at
 * all — the status banner on a broken login screen, the country list on the
 * registration form.
 */
export const publicRestClient = createClient<paths>({ baseUrl })
