import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'
import en from '../../../../messages/en.json'

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

type Messages = Record<string, unknown>
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const parts = [...namespace.split('.'), key]
    let val: unknown = en
    for (const p of parts) val = (val as Messages)?.[p]
    return typeof val === 'string' ? val : key
  },
  useLocale: () => 'en',
}))

let mockRegister: jest.Mock
jest.mock('@connectrpc/connect', () => ({
  createClient: () => ({
    register: (...args: unknown[]) => mockRegister?.(...args),
    updateMe: jest.fn().mockResolvedValue({}),
  }),
}))
// The country picker moved to the REST transport. Mocked at the hook rather
// than at fetch: this suite is about the registration flow, and stubbing the
// HTTP layer would only re-test openapi-fetch.
let mockCountries: { code: string; name: string }[]
jest.mock('@/hooks/useCountries', () => ({
  useCountries: () => ({ countries: mockCountries, isLoading: false }),
}))
jest.mock('@/lib/api/client', () => ({
  publicTransport: {},
  createTransport: () => ({}),
}))
jest.mock('@/gen/wellspent/v1/auth_connect', () => ({ AuthService: {} }))
jest.mock('@/gen/wellspent/v1/user_connect', () => ({ UserService: {} }))

// csharpAuth defaults false, matching production until a domain actually
// flips — individual tests override it to exercise the REST branch.
const mockIsEnabled = jest.fn().mockReturnValue(false)
jest.mock('@/lib/config/features', () => ({ isEnabled: (flag: string) => mockIsEnabled(flag) }))

let mockRegisterPost: jest.Mock
jest.mock('@/lib/api/rest', () => ({
  publicDotnetRestClient: { POST: (...args: unknown[]) => mockRegisterPost?.(...args) },
  unwrap: (result: { data?: unknown; error?: { message?: string } }) => {
    if (result.error !== undefined || result.data === undefined) {
      throw new Error(result.error?.message ?? 'rest request failed')
    }
    return result.data
  },
}))

// ── helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockRegister = jest.fn()
  mockRegisterPost = jest.fn()
  mockIsEnabled.mockReturnValue(false)
  mockCountries = [{ code: 'US', name: 'United States' }]
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  localStorage.clear()
})

async function fillAndSubmit(overrides: { firstName?: string; email?: string; password?: string } = {}) {
  await userEvent.type(screen.getByLabelText(/first name/i), overrides.firstName ?? 'Jane')
  await userEvent.type(screen.getByLabelText(/email/i), overrides.email ?? 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), overrides.password ?? 'Secret1!')
  await userEvent.click(screen.getByRole('button', { name: /create account/i }))
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('RegisterForm', () => {
  it('renders first name, email, and password fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the Google sign-in button as disabled', () => {
    render(<RegisterForm />)
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
  })

  it('calls the register RPC with name, email, password, language, and currency', async () => {
    mockRegister.mockResolvedValueOnce({ accessToken: 'tok' })
    render(<RegisterForm />)
    await fillAndSubmit()
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Jane',
        email: 'jane@example.com',
        password: 'Secret1!',
        language: 'en',
        currency: 'USD',
      }))
    })
  })

  it('sends the access token and its real expiry to the set-token API route', async () => {
    mockRegister.mockResolvedValueOnce({ accessToken: 'newtoken', expiresIn: 3600 })
    render(<RegisterForm />)
    await fillAndSubmit()
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/set-token', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'newtoken', expiresIn: 3600 }),
      }))
    })
  })

  it('redirects to /budgets after successful registration', async () => {
    mockRegister.mockResolvedValueOnce({ accessToken: 'tok' })
    render(<RegisterForm />)
    await fillAndSubmit()
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/budgets', expect.objectContaining({ locale: 'en' }))
    )
  })

  it('shows an error message when registration fails', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already in use'))
    render(<RegisterForm />)
    await fillAndSubmit()
    expect(await screen.findByText('Email already in use')).toBeInTheDocument()
  })

  it('does not redirect when registration fails', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already in use'))
    render(<RegisterForm />)
    await fillAndSubmit()
    await screen.findByText('Email already in use')
    expect(mockPush).not.toHaveBeenCalled()
  })

  describe('with csharpAuth enabled', () => {
    beforeEach(() => {
      mockIsEnabled.mockReturnValue(true)
    })

    it('calls the REST register endpoint instead of the register RPC', async () => {
      mockRegisterPost.mockResolvedValueOnce({ data: { accessToken: 'tok', expiresIn: 3600 } })
      render(<RegisterForm />)
      await fillAndSubmit()
      await waitFor(() => {
        expect(mockRegisterPost).toHaveBeenCalledWith('/rest/v1/auth/register', {
          body: expect.objectContaining({ firstName: 'Jane', email: 'jane@example.com', password: 'Secret1!' }),
        })
      })
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('redirects to /budgets after a successful REST registration', async () => {
      mockRegisterPost.mockResolvedValueOnce({ data: { accessToken: 'tok', expiresIn: 3600 } })
      render(<RegisterForm />)
      await fillAndSubmit()
      await waitFor(() =>
        expect(mockPush).toHaveBeenCalledWith('/budgets', expect.objectContaining({ locale: 'en' }))
      )
    })

    it('shows an error message when the REST registration fails', async () => {
      mockRegisterPost.mockResolvedValueOnce({ error: { code: 'already_exists', message: 'Email already in use' } })
      render(<RegisterForm />)
      await fillAndSubmit()
      expect(await screen.findByText('Email already in use')).toBeInTheDocument()
    })
  })
})
