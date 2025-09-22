"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  nome?: string
  role?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
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
          // Decodificar token JWT para obter informações do usuário
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const user: User = {
              id: payload.sub || payload.user_id,
              email: payload.email,
              nome: payload.user_metadata?.nome || payload.name,
              role: payload.user_metadata?.role || payload.role
            }
            
            setAuthState({
              isAuthenticated: true,
              user,
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
            loading: false,
            error: null
          })
        }
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro de autenticação'
      })
    }
  }

  const login = (token: string, user?: User) => {
    try {
      localStorage.setItem('access_token', token)
      
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
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
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login'
      })
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('access_token')
      setAuthState({
        isAuthenticated: false,
        user: null,
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

  return {
    ...authState,
    login,
    logout,
    refreshAuth
  }
}

export default useAuth
