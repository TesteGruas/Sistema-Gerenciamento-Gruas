import { useEffect, useState } from "react"

/**
 * Hook para debounce de valores com delay configurável
 * Útil para busca, filtros, etc - evita chamadas excessivas
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em milliseconds (padrão: 300ms)
 * @returns Valor debounced
 * 
 * @example
 * const [query, setQuery] = useState('')
 * const debouncedQuery = useDebouncedValue(query, 300)
 * 
 * useEffect(() => {
 *   // Só executa após 300ms de pausa na digitação
 *   buscarFuncionarios(debouncedQuery)
 * }, [debouncedQuery])
 */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  
  return debounced
}
