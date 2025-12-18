import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { usePermissions } from './use-permissions'

/**
 * Hook para verificar se o modo debug está ativado
 * Apenas administradores podem ver e usar funções de debug
 */
export function useDebugMode() {
  const { isAdmin } = usePermissions()
  const [debugMode, setDebugMode] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Obter valor de isAdmin para usar como dependência
  const isAdminValue = isAdmin()

  const loadDebugMode = useCallback(async () => {
    try {
      const response = await api.get('/configuracoes/debug_mode_enabled')
      
      if (response.data && response.data.success) {
        const valor = response.data.data?.valor
        
        // Verificar se o valor é true (boolean ou string 'true')
        const isEnabled = valor === true || valor === 'true' || valor === 1 || valor === '1'
        
        setDebugMode(isEnabled)
      } else {
        setDebugMode(false)
      }
    } catch (error: any) {
      // Se não existir (404) ou rate limit (429), assume false silenciosamente
      if (error.response?.status === 404 || error.response?.status === 429) {
        setDebugMode(false)
      } else {
        console.error('Erro ao carregar modo debug:', error)
        setDebugMode(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Apenas verificar se for admin
    if (isAdminValue) {
      loadDebugMode()
    } else {
      setDebugMode(false)
      setLoading(false)
    }
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminValue, loadDebugMode]) // Executar quando isAdmin ou loadDebugMode mudar

  return {
    debugMode: isAdminValue && debugMode,
    loading,
    isAdmin: isAdminValue
  }
}

