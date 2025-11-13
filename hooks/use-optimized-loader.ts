import { useState, useEffect, useRef, useCallback } from 'react'

interface UseOptimizedLoaderOptions {
  /**
   * Função que carrega os dados
   */
  loadFn: () => Promise<void>
  
  /**
   * Dependências que devem disparar o reload (filtros, paginação, etc.)
   */
  dependencies?: any[]
  
  /**
   * Delay em ms para debounce (padrão: 300ms)
   */
  debounceMs?: number
  
  /**
   * Se deve carregar automaticamente na montagem (padrão: true)
   */
  autoLoad?: boolean
}

/**
 * Hook otimizado para carregar dados com:
 * - Prevenção de chamadas duplicadas
 * - Debounce para filtros
 * - Controle de loading
 */
export function useOptimizedLoader({
  loadFn,
  dependencies = [],
  debounceMs = 300,
  autoLoad = true
}: UseOptimizedLoaderOptions) {
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (autoLoad && !dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      loadFn().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, dadosIniciaisCarregados])

  // Recarregar quando dependências mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados || !autoLoad) return
    
    // Limpar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // Debounce para evitar múltiplas chamadas rápidas
    timerRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        loadFn().finally(() => {
          loadingRef.current = false
        })
      }
    }, debounceMs)
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, dadosIniciaisCarregados, autoLoad])

  // Função para recarregar manualmente
  const reload = useCallback(() => {
    if (!loadingRef.current) {
      loadingRef.current = true
      return loadFn().finally(() => {
        loadingRef.current = false
      })
    }
  }, [loadFn])

  // Função para resetar o estado (útil para logout/login)
  const reset = useCallback(() => {
    setDadosIniciaisCarregados(false)
    loadingRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    isLoading: loadingRef.current,
    dadosCarregados: dadosIniciaisCarregados,
    reload,
    reset
  }
}

