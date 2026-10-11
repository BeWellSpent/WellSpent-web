import { renderHook, waitFor } from '@testing-library/react'
import { useStatusBanner } from '../useStatusBanner'

const mockIsEnabled = jest.fn().mockReturnValue(false)
jest.mock('@/lib/config/features', () => ({ isEnabled: (flag: string) => mockIsEnabled(flag) }))

let mockGoGet: jest.Mock
let mockDotnetGet: jest.Mock
jest.mock('@/lib/api/rest', () => ({
  publicRestClient: { GET: (...args: unknown[]) => mockGoGet?.(...args) },
  publicDotnetRestClient: { GET: (...args: unknown[]) => mockDotnetGet?.(...args) },
  unwrap: (result: { data?: unknown; error?: unknown }) => {
    if (result.error !== undefined || result.data === undefined) throw new Error('rest request failed')
    return result.data
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockIsEnabled.mockReturnValue(false)
  mockGoGet = jest.fn().mockResolvedValue({ data: { banner: null } })
  mockDotnetGet = jest.fn().mockResolvedValue({ data: { banner: null } })
  localStorage.clear()
})

describe('useStatusBanner', () => {
  it('reads from the Go backend by default', async () => {
    renderHook(() => useStatusBanner())
    await waitFor(() => expect(mockGoGet).toHaveBeenCalledWith('/rest/v1/status/banner'))
    expect(mockDotnetGet).not.toHaveBeenCalled()
  })

  it('reads from the C# backend when csharpStatusChangelog is enabled', async () => {
    mockIsEnabled.mockReturnValue(true)
    renderHook(() => useStatusBanner())
    await waitFor(() => expect(mockDotnetGet).toHaveBeenCalledWith('/rest/v1/status/banner'))
    expect(mockGoGet).not.toHaveBeenCalled()
  })

  it('surfaces the active banner from whichever backend is enabled', async () => {
    const banner = { id: 'b1', severity: 'warning', message: 'Degraded performance' }
    mockDotnetGet.mockResolvedValue({ data: { banner } })
    mockIsEnabled.mockReturnValue(true)
    const { result } = renderHook(() => useStatusBanner())
    await waitFor(() => expect(result.current.banner).toEqual(banner))
  })
})
