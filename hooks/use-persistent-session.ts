"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { sessionPersistence, SessionData } from "@/lib/session-persistence"
import { useToast } from "@/hooks/use-toast"

interface PersistentSessionState {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  email: string | null
  biometricAvailable: boolean
  biometricConfigured: boolean
  rememberEmail: boolean
}

export function usePersistentSession() {
  const [state, setState] = useState<PersistentSessionState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    email: null,
    biometricAvailable: false,
    biometricConfigured: false,
    rememberEmail: false
  })
  
  const router = useRouter()
  const { toast } = useToast()

  // Verificar se biometria está disponível
  const checkBiometricAvailability = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    return !!(
      window.PublicKeyCredential &&
      window.navigator.credentials &&
      window.navigator.credentials.create
    )
  }, [])

  // Carregar sessão persistente
  const loadPersistentSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // Verificar disponibilidade biométrica
      const biometricAvailable = checkBiometricAvailability()
      const biometricConfigured = sessionPersistence.isBiometricConfigured()
      
      // Verificar se IndexedDB está disponível
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[PersistentSession] IndexedDB não disponível, usando apenas localStorage')
      }
      
      // Tentar recuperar sessão salva
      const session = await sessionPersistence.getSession()
      
      if (session) {
        // Sessão encontrada, restaurar dados
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: session.userData,
          email: session.email,
          biometricAvailable,
          biometricConfigured,
          rememberEmail: !!sessionPersistence.getRememberedEmail()
        })
        
        // Restaurar dados no localStorage para compatibilidade
        localStorage.setItem('access_token', session.token)
        localStorage.setItem('user_data', JSON.stringify(session.userData))
        if (session.refreshToken) {
          localStorage.setItem('refresh_token', session.refreshToken)
        }
        
        return true
      } else {
        // Nenhuma sessão encontrada
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          email: sessionPersistence.getRememberedEmail(),
          biometricAvailable,
          biometricConfigured,
          rememberEmail: !!sessionPersistence.getRememberedEmail()
        })
        return false
      }
    } catch (error) {
      console.error('[PersistentSession] Erro ao carregar sessão:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [checkBiometricAvailability])

  // Salvar sessão
  const saveSession = useCallback(async (userData: any, token: string, refreshToken?: string) => {
    try {
      const sessionData: SessionData = {
        email: userData.email || userData.nome,
        token,
        refreshToken,
        userData,
        lastLogin: Date.now(),
        biometricEnabled: state.biometricConfigured
      }
      
      await sessionPersistence.saveSession(sessionData)
      
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: userData,
        email: sessionData.email
      }))
      
      console.log('[PersistentSession] Sessão salva com sucesso')
    } catch (error) {
      console.error('[PersistentSession] Erro ao salvar sessão:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar sessão",
        variant: "destructive"
      })
    }
  }, [state.biometricConfigured, toast])

  // Fazer logout
  const logout = useCallback(async () => {
    try {
      await sessionPersistence.clearSession()
      
      // Limpar localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_profile')
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        email: null,
        biometricAvailable: checkBiometricAvailability(),
        biometricConfigured: false,
        rememberEmail: false
      })
      
      // Detectar se é PWA e redirecionar corretamente
      const isPWA = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        window.location.pathname.startsWith('/pwa')
      )
      router.push(isPWA ? '/pwa/login' : '/')
      console.log('[PersistentSession] Logout realizado com sucesso')
    } catch (error) {
      console.error('[PersistentSession] Erro ao fazer logout:', error)
    }
  }, [router, checkBiometricAvailability])

  // Configurar autenticação biométrica
  const setupBiometric = useCallback(async (email: string) => {
    try {
      const success = await sessionPersistence.setupBiometricAuth(email)
      
      if (success) {
        setState(prev => ({ ...prev, biometricConfigured: true }))
        toast({
          title: "Sucesso",
          description: "Autenticação biométrica configurada com sucesso",
          variant: "default"
        })
        return true
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível configurar autenticação biométrica",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('[PersistentSession] Erro ao configurar biometria:', error)
      toast({
        title: "Erro",
        description: "Erro ao configurar autenticação biométrica",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  // Autenticar com biometria
  const authenticateWithBiometric = useCallback(async () => {
    try {
      const session = await sessionPersistence.authenticateWithBiometric()
      
      if (session) {
        // Restaurar sessão
        localStorage.setItem('access_token', session.token)
        localStorage.setItem('user_data', JSON.stringify(session.userData))
        if (session.refreshToken) {
          localStorage.setItem('refresh_token', session.refreshToken)
        }
        
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: session.userData,
          email: session.email
        }))
        
        router.push('/pwa')
        return true
      } else {
        toast({
          title: "Erro",
          description: "Autenticação biométrica falhou",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('[PersistentSession] Erro na autenticação biométrica:', error)
      toast({
        title: "Erro",
        description: "Erro na autenticação biométrica",
        variant: "destructive"
      })
      return false
    }
  }, [router, toast])

  // Salvar email para lembrar
  const rememberEmail = useCallback((email: string) => {
    sessionPersistence.saveRememberedEmail(email)
    setState(prev => ({ ...prev, rememberEmail: true, email }))
  }, [])

  // Limpar email salvo
  const clearRememberedEmail = useCallback(() => {
    sessionPersistence.clearRememberedEmail()
    setState(prev => ({ ...prev, rememberEmail: false, email: null }))
  }, [])

  // Remover configuração biométrica
  const removeBiometric = useCallback(() => {
    sessionPersistence.clearBiometricAuth()
    setState(prev => ({ ...prev, biometricConfigured: false }))
  }, [])

  // Carregar sessão na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadPersistentSession()
    }
  }, [loadPersistentSession])

  // Verificar atividade do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleActivity = () => {
      if (state.isAuthenticated) {
        sessionPersistence.updateLastActivity()
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [state.isAuthenticated])

  return {
    ...state,
    loadPersistentSession,
    saveSession,
    logout,
    setupBiometric,
    authenticateWithBiometric,
    rememberEmail,
    clearRememberedEmail,
    removeBiometric
  }
}
