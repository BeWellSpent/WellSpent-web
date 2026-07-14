import { renderHook, act } from '@testing-library/react'
import { useViewPreference } from '../useViewPreference'

const STORAGE_KEY = 'wellspent_view_mode'

beforeEach(() => localStorage.clear())

describe('useViewPreference', () => {
  it('returns the default mode when localStorage is empty', () => {
    const { result } = renderHook(() => useViewPreference('tabbed'))
    expect(result.current[0]).toBe('tabbed')
  })

  it('accepts split as the default mode', () => {
    const { result } = renderHook(() => useViewPreference('split'))
    expect(result.current[0]).toBe('split')
  })

  it('reads a stored split value from localStorage on mount', async () => {
    localStorage.setItem(STORAGE_KEY, 'split')
    const { result } = renderHook(() => useViewPreference('tabbed'))
    await act(async () => {})
    expect(result.current[0]).toBe('split')
  })

  it('reads a stored tabbed value from localStorage on mount', async () => {
    localStorage.setItem(STORAGE_KEY, 'tabbed')
    const { result } = renderHook(() => useViewPreference('split'))
    await act(async () => {})
    expect(result.current[0]).toBe('tabbed')
  })

  it('ignores an invalid stored value and keeps the default', async () => {
    localStorage.setItem(STORAGE_KEY, 'grid')
    const { result } = renderHook(() => useViewPreference('tabbed'))
    await act(async () => {})
    expect(result.current[0]).toBe('tabbed')
  })

  it('updates state when setter is called', () => {
    const { result } = renderHook(() => useViewPreference('tabbed'))
    act(() => result.current[1]('split'))
    expect(result.current[0]).toBe('split')
  })

  it('persists the new mode to localStorage', () => {
    const { result } = renderHook(() => useViewPreference('tabbed'))
    act(() => result.current[1]('split'))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('split')
  })

  it('overwrites a previously stored value', async () => {
    localStorage.setItem(STORAGE_KEY, 'split')
    const { result } = renderHook(() => useViewPreference('tabbed'))
    await act(async () => {})
    act(() => result.current[1]('tabbed'))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('tabbed')
  })
})
