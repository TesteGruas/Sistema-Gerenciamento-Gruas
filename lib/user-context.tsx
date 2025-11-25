"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
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
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)

  // Carregar usuário atual ao montar o componente - apenas uma vez
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (loadingRef.current || dadosIniciaisCarregados) return
      
      try {
        loadingRef.current = true
        // Procurar por 'access_token' (usado pelo AuthService) ou 'token' (compatibilidade)
        const token = typeof window !== 'undefined' 
          ? (localStorage.getItem('access_token') || localStorage.getItem('token'))
          : null
        
        if (token) {
          const user = await AuthService.getCurrentUser()
          
          const userObject = {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'ativo' as const,
            createdAt: new Date().toISOString()
          }
          
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
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error instanceof Error ? error.message : 'Erro desconhecido')
        // Se falhar, limpar token inválido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('access_token')
        }
      } finally {
        setLoading(false)
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      }
    }

    loadCurrentUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (data.data.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token)
        }
        
        // Carregar dados do usuário apenas se não estiver em loading
        if (!loadingRef.current) {
          loadingRef.current = true
          try {
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
          } finally {
            loadingRef.current = false
          }
        }
        
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
