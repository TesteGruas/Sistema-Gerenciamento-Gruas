"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService } from '@/app/lib/auth'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'administrador' | 'gerente' | 'supervisor' | 'engenheiro' | 'mestre de obra' | 'operador' | 'cliente' | 'chefe_obras' | 'funcionario' | 'diretor' | string
  obraId?: string
  obraName?: string
  status: 'ativo' | 'inativo'
  createdAt: string
  lastLogin?: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  // Inicializar com null - dados serão carregados via getCurrentUser
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar usuário atual ao montar o componente
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Procurar por 'access_token' (usado pelo AuthService) ou 'token' (compatibilidade)
        const token = typeof window !== 'undefined' 
          ? (localStorage.getItem('access_token') || localStorage.getItem('token'))
          : null
        console.log('[UserContext] Verificando token:', token ? 'Token encontrado' : 'Sem token')
        
        if (token) {
          console.log('[UserContext] Carregando dados do usuário...')
          const user = await AuthService.getCurrentUser()
          console.log('[UserContext] Usuário carregado:', user)
          console.log('[UserContext] Role do usuário:', user.role)
          
          const userObject = {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'ativo' as const,
            createdAt: new Date().toISOString()
          }
          
          console.log('[UserContext] Objeto do usuário criado:', userObject)
          
          // Salvar dados no localStorage para sincronizar com useAuth()
          if (user.perfil) {
            localStorage.setItem('user_perfil', JSON.stringify(user.perfil))
          }
          if (user.permissoes && user.permissoes.length > 0) {
            localStorage.setItem('user_permissoes', JSON.stringify(user.permissoes))
          }
          if (user.profile) {
            localStorage.setItem('user_profile', JSON.stringify(user.profile))
          }
          
          setCurrentUser(userObject)
          console.log('[UserContext] setCurrentUser chamado com sucesso')
          console.log('[UserContext] Dados salvos no localStorage para useAuth()')
        } else {
          console.log('[UserContext] Nenhum token encontrado no localStorage')
        }
      } catch (error) {
        console.error('[UserContext] Erro ao carregar usuário:', error)
        console.error('[UserContext] Stack trace:', error instanceof Error ? error.stack : 'N/A')
        // Se falhar, limpar token inválido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('access_token')
        }
      } finally {
        console.log('[UserContext] Finalizando loadCurrentUser, setLoading(false)')
        setLoading(false)
      }
    }

    loadCurrentUser()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Login real via AuthService
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      if (data.success && data.data.access_token) {
        localStorage.setItem('access_token', data.data.access_token)
        
        // Carregar dados do usuário
        const user = await AuthService.getCurrentUser()
        
        // Salvar dados no localStorage para sincronizar com useAuth()
        if (user.perfil) {
          localStorage.setItem('user_perfil', JSON.stringify(user.perfil))
        }
        if (user.permissoes && user.permissoes.length > 0) {
          localStorage.setItem('user_permissoes', JSON.stringify(user.permissoes))
        }
        if (user.profile) {
          localStorage.setItem('user_profile', JSON.stringify(user.profile))
        }
        
        setCurrentUser({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: 'ativo',
          createdAt: new Date().toISOString()
        })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
