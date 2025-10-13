import { renderHook, act } from '@testing-library/react'
import { useLoading } from '@/components/ui/loading'

describe('useLoading Hook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useLoading())
    
    expect(result.current.loading).toBe(false)
    expect(typeof result.current.setLoading).toBe('function')
    expect(typeof result.current.startLoading).toBe('function')
    expect(typeof result.current.stopLoading).toBe('function')
  })

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useLoading(true))
    
    expect(result.current.loading).toBe(true)
  })

  it('should update loading state with setLoading', () => {
    const { result } = renderHook(() => useLoading())
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(result.current.loading).toBe(true)
    
    act(() => {
      result.current.setLoading(false)
    })
    
    expect(result.current.loading).toBe(false)
  })

  it('should start loading with startLoading', () => {
    const { result } = renderHook(() => useLoading(false))
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.loading).toBe(true)
  })

  it('should stop loading with stopLoading', () => {
    const { result } = renderHook(() => useLoading(true))
    
    act(() => {
      result.current.stopLoading()
    })
    
    expect(result.current.loading).toBe(false)
  })

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useLoading())
    
    const asyncOperation = async () => {
      result.current.startLoading()
      await new Promise(resolve => setTimeout(resolve, 100))
      result.current.stopLoading()
    }
    
    expect(result.current.loading).toBe(false)
    
    await act(async () => {
      await asyncOperation()
    })
    
    expect(result.current.loading).toBe(false)
  })

  it('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useLoading())
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(result.current.loading).toBe(true)
    
    rerender()
    
    expect(result.current.loading).toBe(true)
  })

  it('should handle multiple state changes', () => {
    const { result } = renderHook(() => useLoading())
    
    act(() => {
      result.current.startLoading()
    })
    expect(result.current.loading).toBe(true)
    
    act(() => {
      result.current.stopLoading()
    })
    expect(result.current.loading).toBe(false)
    
    act(() => {
      result.current.startLoading()
    })
    expect(result.current.loading).toBe(true)
  })
})
