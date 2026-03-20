"use client"

import { useState, useEffect } from "react"
import { decodeJwtPayload, normalizeAccessToken } from "@/lib/jwt-decode-client"

interface User {
  id: string
  email: string
  nome?: string
  role?: string
}

interface Perfil {
  id: number
  nome: string
  nivel_acesso: number
  descricao: string
  status: 'Ativo' | 'Inativo'
}

interface Permissao {
  id: number
  nome: string
  descricao: string
  modulo: string
  acao: string
  recurso?: string
  status: 'Ativa' | 'Inativa'
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
    // Só executar no cliente
    if (typeof window !== 'undefined') {
      checkAuthentication()
    } else {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const checkAuthentication = () => {
    try {
      // Verificação dupla para garantir que estamos no cliente
      if (typeof window === 'undefined') {
        setAuthState(prev => ({ ...prev, loading: false }))
        return
      }
      
      const rawToken = localStorage.getItem('access_token')
      const token = normalizeAccessToken(rawToken)
      if (token && rawToken != null && token !== rawToken.trim()) {
        localStorage.setItem('access_token', token)
      }

        if (token) {
          // Buscar dados salvos no localStorage
          const userProfile = localStorage.getItem('user_profile')
          const userPerfil = localStorage.getItem('user_perfil')
          const userPermissoes = localStorage.getItem('user_permissoes')
          
          // Decodificar token JWT (Base64URL no payload — não usar atob direto no segmento bruto)
          try {
            const payload = decodeJwtPayload<{
              sub?: string
              user_id?: string
              email?: string
              role?: string
              name?: string
              user_metadata?: { nome?: string; role?: string }
            }>(token)

            let perfil: Perfil | null = null
            let permissoes: Permissao[] = []
            try {
              perfil = userPerfil ? JSON.parse(userPerfil) : null
            } catch {
              perfil = null
            }
            try {
              permissoes = userPermissoes ? JSON.parse(userPermissoes) : []
            } catch {
              permissoes = []
            }

            let user: User | null = null

            if (payload) {
              const role = perfil?.nome || payload.role || payload.user_metadata?.role
              user = {
                id: String(payload.sub || payload.user_id || ''),
                email: String(payload.email || ''),
                nome: payload.user_metadata?.nome || payload.name,
                role
              }
            } else {
              // Token opaco ou formato inesperado: usar user_data salvo no login
              const raw = localStorage.getItem('user_data')
              if (raw) {
                try {
                  const ud = JSON.parse(raw) as {
                    id?: string | number
                    email?: string
                    user_metadata?: { nome?: string }
                  }
                  const role = perfil?.nome || localStorage.getItem('user_role') || undefined
                  user = {
                    id: String(ud.id ?? ''),
                    email: String(ud.email ?? ''),
                    nome: ud.user_metadata?.nome,
                    role
                  }
                } catch {
                  user = null
                }
              }
            }

            if (!user || !user.id) {
              console.warn('[useAuth] Token sem payload decodificável e sem user_data — encerrando sessão')
              logout()
              return
            }

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
        // Detectar se é PWA e redirecionar corretamente
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true ||
                      window.location.pathname.startsWith('/pwa')
        window.location.href = isPWA ? '/pwa/login' : '/'
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
