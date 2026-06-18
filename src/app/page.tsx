import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TOKEN_COOKIE } from '@/lib/auth/token'

export default function Home() {
  const token = cookies().get(TOKEN_COOKIE)
  redirect(token ? '/budgets' : '/login')
}
