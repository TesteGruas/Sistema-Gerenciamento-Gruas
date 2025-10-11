import { useState, useEffect, useRef } from 'react'

/**
 * Hook para throttle de valores
 * Útil para scroll, resize, etc
 * 
 * @param value - Valor a ser throttled
 * @param interval - Intervalo em milliseconds (padrão: 500ms)
 * @returns Valor throttled
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0)
 * const throttledScrollY = useThrottle(scrollY, 100)
 * 
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY)
 *   window.addEventListener('scroll', handleScroll)
 *   return () => window.removeEventListener('scroll', handleScroll)
 * }, [])
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, interval)

      return () => clearTimeout(timerId)
    }
  }, [value, interval])

  return throttledValue
}

