import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useMe } from '../useMe'
import { AccountPlan, FilingStatus, TaxPaymentFrequency } from '@/gen/wellspent/v1/common_pb'

const mockIsEnabled = jest.fn().mockReturnValue(false)
jest.mock('@/lib/config/features', () => ({ isEnabled: (flag: string) => mockIsEnabled(flag) }))

let mockGetMe: jest.Mock
jest.mock('@connectrpc/connect', () => ({ createClient: () => ({ getMe: (...args: unknown[]) => mockGetMe?.(...args) }) }))
jest.mock('@connectrpc/connect-query', () => ({ useTransport: () => ({}) }))
jest.mock('@/gen/wellspent/v1/user_connect', () => ({ UserService: {} }))

let mockDotnetGet: jest.Mock
jest.mock('@/hooks/useDotnetRestClient', () => ({ useDotnetRestClient: () => ({ GET: (...args: unknown[]) => mockDotnetGet?.(...args) }) }))
jest.mock('@/lib/api/rest', () => ({
  unwrap: (result: { data?: unknown; error?: unknown }) => {
    if (result.error !== undefined || result.data === undefined) throw new Error('rest request failed')
    return result.data
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsEnabled.mockReturnValue(false)
  mockGetMe = jest.fn()
  mockDotnetGet = jest.fn()
})

describe('useMe', () => {
  it('reads from the Go backend by default', async () => {
    mockGetMe.mockResolvedValue({ user: { firstName: 'Ann', plan: AccountPlan.PRO } })
    const { result } = renderHook(() => useMe(), { wrapper })
    await waitFor(() => expect(result.current.user).toBeDefined())
    expect(result.current.user?.firstName).toBe('Ann')
    expect(mockDotnetGet).not.toHaveBeenCalled()
  })

  it('reads from the C# backend when csharpUser is enabled, normalizing plan to the proto enum', async () => {
    mockIsEnabled.mockReturnValue(true)
    mockDotnetGet.mockResolvedValue({
      data: {
        user: {
          id: 'u1', email: 'ann@example.com', firstName: 'Ann', lastName: 'Lee',
          isActive: true, isVerified: true, countryCode: 'US', stateCode: 'CA',
          filingStatus: 1, taxPaymentFrequency: 4, language: 'en', currency: 'USD',
          plan: 'lifetime', hasApplePrivateEmail: false,
        },
      },
    })
    const { result } = renderHook(() => useMe(), { wrapper })
    await waitFor(() => expect(result.current.user).toBeDefined())
    expect(result.current.user?.firstName).toBe('Ann')
    expect(result.current.user?.plan).toBe(AccountPlan.LIFETIME)
    expect(result.current.user?.filingStatus).toBe(FilingStatus.SINGLE)
    expect(result.current.user?.taxPaymentFrequency).toBe(TaxPaymentFrequency.FOUR_MONTHLY)
    expect(mockGetMe).not.toHaveBeenCalled()
  })

  it.each([
    ['free', AccountPlan.FREE],
    ['pro', AccountPlan.PRO],
    ['lifetime', AccountPlan.LIFETIME],
  ])('maps REST plan %s to proto AccountPlan %s', async (restPlan, expected) => {
    mockIsEnabled.mockReturnValue(true)
    mockDotnetGet.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@example.com', isActive: true, isVerified: true, filingStatus: 0, taxPaymentFrequency: 0, language: 'en', currency: 'USD', plan: restPlan, hasApplePrivateEmail: false } },
    })
    const { result } = renderHook(() => useMe(), { wrapper })
    await waitFor(() => expect(result.current.user).toBeDefined())
    expect(result.current.user?.plan).toBe(expected)
  })
})
