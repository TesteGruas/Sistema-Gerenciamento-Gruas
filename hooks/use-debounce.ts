import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores
 * Útil para busca, filtros, etc
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em milliseconds (padrão: 500ms)
 * @returns Valor debounced
 * 
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 500)
 * 
 * useEffect(() => {
 *   // Só busca após 500ms sem digitar
 *   buscarDados(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Criar timeout que atualiza o valor depois do delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpar timeout se value mudar antes do delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

