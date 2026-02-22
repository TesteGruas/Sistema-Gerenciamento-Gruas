import { useState, useEffect, useRef } from 'react'
import { livroGruaApi } from '@/lib/api-livro-grua'

interface ObraResponsavel {
  responsavel_id: number
  obra_id: number
  obra_nome: string
  obra_status: string
}

interface CurrentUser {
  id: number
  nome: string
  cargo: string
  role?: string
  email?: string
  funcionario_id?: number
  obras_responsavel?: ObraResponsavel[]
  is_responsavel_obra?: boolean
  isAdmin?: boolean
  isGestor?: boolean
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  
  useEffect(() => {
    const fetchUser = async () => {
      if (loadingRef.current || dadosIniciaisCarregados) return
      
      try {
        loadingRef.current = true
        setLoading(true)
        setError(null)
        
        console.log('⏳ [Preload] Buscando dados do funcionário logado...')
        const startTime = performance.now()
        const userData = await livroGruaApi.obterFuncionarioLogado()
        const duration = Math.round(performance.now() - startTime)
        console.log(`✅ [Preload] Dados do funcionário recebidos (${duration}ms)`)
        
        const userWithFlags = {
          ...userData,
          isAdmin: userData.role === 'admin' || userData.cargo?.toLowerCase().includes('admin'),
          isGestor: userData.role === 'gestor' || userData.cargo?.toLowerCase().includes('gestor')
        }
        
        console.log('🔍 [useCurrentUser] Dados do usuário:', {
          id: userWithFlags.id,
          role: userWithFlags.role,
          funcionario_id: userWithFlags.funcionario_id,
          is_responsavel_obra: userWithFlags.is_responsavel_obra,
          obras_responsavel: userWithFlags.obras_responsavel
        })
        
        setUser(userWithFlags)
        setDadosIniciaisCarregados(true)
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        setError('Erro ao carregar dados do usuário')
        setUser(null)
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }
    
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return { 
    user, 
    loading, 
    error,
    isAdmin: user?.isAdmin || false,
    isGestor: user?.isGestor || false
  }
}

export default useCurrentUser
