import { createClient } from '@connectrpc/connect'
import { AuthService } from '@/gen/wellspent/v1/auth_connect'
import { publicTransport } from '@/lib/api/client'
import { publicDotnetRestClient, unwrap } from '@/lib/api/rest'
import { isEnabled } from '@/lib/config/features'

const connectAuthClient = createClient(AuthService, publicTransport)

/** Shared by LoginForm's and RegisterForm's Google sign-in buttons — see `rest.ts`'s cutover-flag doc comment. */
export async function getGoogleAuthUrl(state: string): Promise<string> {
  if (isEnabled('csharpAuth')) {
    const res = unwrap(await publicDotnetRestClient.GET('/rest/v1/auth/google/url', { params: { query: { state } } }))
    return res.url
  }
  const res = await connectAuthClient.getGoogleAuthURL({ state })
  return res.url
}
