import { useState, useEffect } from 'react'
import { livroGruaApi } from '@/lib/api-livro-grua'

interface CurrentUser {
  id: number
  nome: string
  cargo: string
  role?: string
  email?: string
  isAdmin?: boolean
  isGestor?: boolean
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Buscando dados do usuário logado...')
        const userData = await livroGruaApi.obterFuncionarioLogado()
        console.log('Dados do usuário recebidos:', userData)
        
        const userWithFlags = {
          ...userData,
          isAdmin: userData.role === 'admin' || userData.cargo?.toLowerCase().includes('admin'),
          isGestor: userData.role === 'gestor' || userData.cargo?.toLowerCase().includes('gestor')
        }
        
        console.log('Usuário processado:', userWithFlags)
        setUser(userWithFlags)
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        setError('Erro ao carregar dados do usuário')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
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
