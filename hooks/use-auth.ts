"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  nome?: string
  role?: string
}

interface Perfil {
  id: number
  nome: string
  nivel_acesso: string
  descricao: string
}

interface Permissao {
  id: number
  nome: string
  descricao: string
  modulo: string
  acao: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  perfil: Perfil | null
  permissoes: Permissao[]
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    perfil: null,
    permissoes: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        
        if (token) {
          // Buscar dados salvos no localStorage
          const userProfile = localStorage.getItem('user_profile')
          const userPerfil = localStorage.getItem('user_perfil')
          const userPermissoes = localStorage.getItem('user_permissoes')
          
          // Decodificar token JWT para obter informações do usuário
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const user: User = {
              id: payload.sub || payload.user_id,
              email: payload.email,
              nome: payload.user_metadata?.nome || payload.name,
              role: payload.user_metadata?.role || payload.role
            }
            
            // Parsear dados salvos
            const perfil: Perfil | null = userPerfil ? JSON.parse(userPerfil) : null
            const permissoes: Permissao[] = userPermissoes ? JSON.parse(userPermissoes) : []
            
            setAuthState({
              isAuthenticated: true,
              user,
              perfil,
              permissoes,
              loading: false,
              error: null
            })
          } catch (decodeError) {
            console.error('Erro ao decodificar token:', decodeError)
            logout()
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            perfil: null,
            permissoes: [],
            loading: false,
            error: null
          })
        }
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        perfil: null,
        permissoes: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Erro de autenticação'
      })
    }
  }

  const login = (token: string, user?: User, perfil?: Perfil, permissoes?: Permissao[]) => {
    try {
      localStorage.setItem('access_token', token)
      
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          perfil: perfil || null,
          permissoes: permissoes || [],
          loading: false,
          error: null
        })
      } else {
        checkAuthentication()
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        perfil: null,
        permissoes: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login'
      })
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_profile')
      localStorage.removeItem('user_perfil')
      localStorage.removeItem('user_permissoes')
      setAuthState({
        isAuthenticated: false,
        user: null,
        perfil: null,
        permissoes: [],
        loading: false,
        error: null
      })
      
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const refreshAuth = () => {
    checkAuthentication()
  }

  const hasPermission = (permission: string): boolean => {
    if (!authState.permissoes || authState.permissoes.length === 0) {
      return false
    }
    return authState.permissoes.some(p => p.nome === permission || p.acao === permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}

export default useAuth
