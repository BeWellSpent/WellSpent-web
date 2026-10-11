import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useChangelog } from '../useChangelog'

const mockIsEnabled = jest.fn().mockReturnValue(false)
jest.mock('@/lib/config/features', () => ({ isEnabled: (flag: string) => mockIsEnabled(flag) }))

let mockGoGet: jest.Mock
let mockDotnetGet: jest.Mock
jest.mock('@/hooks/useRestClient', () => ({ useRestClient: () => ({ GET: (...args: unknown[]) => mockGoGet?.(...args) }) }))
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
  mockGoGet = jest.fn().mockResolvedValue({ data: { releases: [], currentServerVersion: '1.0.0' } })
  mockDotnetGet = jest.fn().mockResolvedValue({ data: { releases: [], currentServerVersion: '1.0.0' } })
})

describe('useChangelog', () => {
  it('reads from the Go backend by default', async () => {
    renderHook(() => useChangelog(['web']), { wrapper })
    await waitFor(() => expect(mockGoGet).toHaveBeenCalled())
    expect(mockDotnetGet).not.toHaveBeenCalled()
  })

  it('reads from the C# backend when csharpStatusChangelog is enabled', async () => {
    mockIsEnabled.mockReturnValue(true)
    renderHook(() => useChangelog(['web']), { wrapper })
    await waitFor(() => expect(mockDotnetGet).toHaveBeenCalled())
    expect(mockGoGet).not.toHaveBeenCalled()
  })

  it('returns releases and server version from whichever backend is enabled', async () => {
    const releases = [{ id: 'r1', component: 'web', version: '1.1.0', items: [] }]
    mockDotnetGet.mockResolvedValue({ data: { releases, currentServerVersion: '2.0.0' } })
    mockIsEnabled.mockReturnValue(true)
    const { result } = renderHook(() => useChangelog(['web']), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.releases).toEqual(releases)
    expect(result.current.serverVersion).toBe('2.0.0')
  })
})
