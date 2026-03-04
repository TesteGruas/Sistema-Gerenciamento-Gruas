"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Smartphone, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  Clock,
  Fingerprint,
  Save,
  CheckCircle
} from "lucide-react"
import { useEnhancedToast } from "@/hooks/use-enhanced-toast"
import { usePersistentSession } from "@/hooks/use-persistent-session"
import { loadUserPermissions } from "@/lib/auth-permissions"
import { useEmpresa } from "@/hooks/use-empresa"
import { EmpresaProvider } from "@/hooks/use-empresa"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import Image from "next/image"

function PWALoginPageContent(): JSX.Element {
  const [formData, setFormData] = useState({
    usuario: "",
    senha: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  // Inicializar como false para evitar erro de hidratação - será true apenas no cliente após verificação
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(false)
  const [setupBiometric, setSetupBiometric] = useState(false)
  const [showBiometricOption, setShowBiometricOption] = useState(false)
  const router = useRouter()
  const { showAuthError, showSuccess, showNetworkError } = useEnhancedToast()
  const { empresa, getEnderecoCompleto, getContatoCompleto } = useEmpresa()
  
  // Hook de sessão persistente
  const {
    isAuthenticated,
    isLoading: sessionLoading,
    email: rememberedEmail,
    biometricAvailable,
    biometricConfigured,
    rememberEmail: hasRememberedEmail,
    saveSession,
    authenticateWithBiometric,
    setupBiometric: setupBiometricAuth,
    rememberEmail: saveRememberedEmail,
    clearRememberedEmail
  } = usePersistentSession()

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
    // Iniciar verificação de autenticação apenas no cliente
    if (sessionLoading) {
      setIsCheckingAuth(true)
    }
  }, [sessionLoading])

  // Verificar se já está autenticado
  useEffect(() => {
    if (!isClient) return // Não executar no servidor
    
    if (isAuthenticated) {
      // Resetar contador de redirecionamentos ao detectar autenticação válida
      if (typeof window !== 'undefined') {
        localStorage.removeItem('redirect_count')
        localStorage.removeItem('last_redirect_path')
      }
      // Usar replace para evitar histórico de navegação
      router.replace('/pwa')
    } else if (!sessionLoading) {
      setIsCheckingAuth(false)
    }
  }, [isAuthenticated, sessionLoading, router, isClient])

  // Carregar email lembrado
  useEffect(() => {
    if (rememberedEmail && hasRememberedEmail) {
      setFormData(prev => ({ ...prev, usuario: rememberedEmail }))
      setRememberEmail(true)
    }
  }, [rememberedEmail, hasRememberedEmail])

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      setIsOnline(navigator.onLine)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const solicitarPermissaoNotificacoesPosLogin = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return

    const desejaAtivar = window.confirm(
      "Deseja ativar notificações no celular para receber avisos de ponto e lembretes importantes?"
    )

    if (!desejaAtivar) return

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        showSuccess("Notificações ativadas com sucesso!")
      }
    } catch (error) {
      console.error('[PWA Login] Erro ao solicitar permissão de notificações:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Usar o rewrite do Next.js (que redireciona /api/* para o backend correto)
      // Isso garante que sempre use a porta 3001 configurada no next.config.mjs
      const loginUrl = '/api/auth/login'
      
      console.log('[PWA Login] Tentando login em:', loginUrl)
      console.log('[PWA Login] Dados:', { email: formData.usuario })

      // Fazer login real com a API
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.usuario,
          password: formData.senha
        })
      })

      console.log('[PWA Login] Status da resposta:', response.status)
      console.log('[PWA Login] Content-Type:', response.headers.get('content-type'))

      let data
      if (!response.ok) {
        // Verificar se a resposta é JSON antes de tentar fazer parse
        const contentType = response.headers.get('content-type')
        let errorData: any = {}
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json()
            console.error('[PWA Login] Erro na resposta (JSON):', errorData)
          } catch (jsonError) {
            console.error('[PWA Login] Erro ao parsear JSON de erro:', jsonError)
            errorData = { error: 'Erro ao processar resposta do servidor' }
          }
        } else {
          // Se não for JSON, tentar ler como texto
          try {
            const errorText = await response.text()
            console.error('[PWA Login] Erro na resposta (texto):', errorText.substring(0, 200))
            errorData = { 
              error: response.status === 500 
                ? 'Erro interno do servidor. Verifique se o backend está rodando corretamente.' 
                : `Erro ${response.status}: ${response.statusText}`
            }
          } catch (textError) {
            console.error('[PWA Login] Erro ao ler resposta como texto:', textError)
            errorData = { 
              error: `Erro ${response.status}: ${response.statusText}` 
            }
          }
        }
        
        const errorMessage = errorData.message || errorData.error || `Erro no login (${response.status})`
        throw new Error(errorMessage)
      }

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('[PWA Login] Resposta não é JSON:', responseText.substring(0, 200))
        throw new Error('Resposta inválida do servidor. Esperado JSON, recebido: ' + contentType)
      }

      try {
        data = await response.json()
        console.log('[PWA Login] Resposta da API:', data)
      } catch (jsonError) {
        console.error('[PWA Login] Erro ao parsear JSON:', jsonError)
        throw new Error('Resposta inválida do servidor')
      }

      if (response.ok && data.success) {
        // Verificar se os dados necessários existem
        if (!data.data || !data.data.access_token) {
          throw new Error('Token de acesso não fornecido pela API')
        }

        // Salvar dados de autenticação
        localStorage.setItem('access_token', data.data.access_token)
        
        // Salvar dados do usuário - incluir profile.funcionario_id e user_metadata.funcionario_id no user_data
        if (data.data.user) {
          // PRIORIDADE: Usar profile.id (ID numérico) ao invés de user.id (UUID)
          // O profile.id é o ID correto da tabela usuarios (119)
          // O user.id é o UUID do Supabase Auth e não deve ser usado como funcionario_id
          const profileId = data.data.profile?.id || null
          
          const userData = {
            ...data.data.user,
            // SOBRESCREVER user.id com profile.id se profile.id existir (ID numérico correto)
            ...(profileId && { id: profileId }),
            // Incluir funcionario_id do profile se existir
            ...(data.data.profile?.funcionario_id && { funcionario_id: data.data.profile.funcionario_id }),
            // Incluir funcionario_id do user_metadata se existir (Supabase Auth)
            ...(data.data.user.user_metadata?.funcionario_id && { 
              funcionario_id: data.data.user.user_metadata.funcionario_id,
              user_metadata: data.data.user.user_metadata
            }),
            // Incluir profile completo
            ...(data.data.profile && { profile: data.data.profile })
          }
          localStorage.setItem('user_data', JSON.stringify(userData))
          console.log('[PWA Login] user_data salvo com id:', userData.id, 'funcionario_id:', userData.funcionario_id || userData.user_metadata?.funcionario_id)
        }
        
        // Salvar dados adicionais se existirem
        if (data.data.profile) {
          localStorage.setItem('user_profile', JSON.stringify(data.data.profile))
        }
        if (data.data.perfil) {
          localStorage.setItem('user_perfil', JSON.stringify(data.data.perfil))
        }
        if (data.data.permissoes) {
          localStorage.setItem('user_permissoes', JSON.stringify(data.data.permissoes))
        }
        
        // Salvar level de acesso (importante para redirecionamento)
        if (data.data.level !== undefined && data.data.level !== null) {
          localStorage.setItem('user_level', String(data.data.level))
        }
        
        // Salvar role
        if (data.data.role) {
          localStorage.setItem('user_role', data.data.role)
        }
        
        // Salvar refresh token se existir
        if (data.data.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token)
        }

        // Salvar sessão persistente
        await saveSession(
          data.data.user,
          data.data.access_token,
          data.data.refresh_token
        )

        // Perguntar no login se o usuário aceita receber notificações
        await solicitarPermissaoNotificacoesPosLogin()

        // Salvar email se solicitado
        if (rememberEmail) {
          saveRememberedEmail(formData.usuario)
        }

        // Mostrar opção de biometria se disponível
        if (biometricAvailable && !biometricConfigured) {
          setShowBiometricOption(true)
        }

        console.log('[PWA Login] Login bem-sucedido!')

        // Carregar permissões do backend antes do redirect
        try {
          console.log('🔐 [PWA] Carregando permissões do backend...')
          await loadUserPermissions()
          console.log('🔐 [PWA] Permissões carregadas com sucesso!')
        } catch (error) {
          console.warn('🔐 [PWA] Aviso: Não foi possível carregar permissões do backend:', error)
          // Continuar mesmo se não conseguir carregar permissões
        }

        // Determinar redirecionamento baseado no nível de acesso
        const userLevel = data.data.level || 0
        const userRole = (data.data.role || '').toLowerCase()
        
        // Apenas Admin (nível 10) → Dashboard (web)
        // Demais níveis → PWA
        let redirectPath = '/pwa'
        if (userLevel === 10 || userRole === 'admin' || userRole === 'administrador') {
          redirectPath = '/dashboard'
        }

        console.log(`🔄 [PWA Login] Redirecionando para: ${redirectPath} (nível: ${userLevel}, role: ${data.data.role})`)

        // Resetar contador de redirecionamentos após login bem-sucedido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('redirect_count')
          localStorage.removeItem('last_redirect_path')
        }

        // Pequeno delay para garantir que o localStorage foi salvo
        setTimeout(() => {
          // Redirecionar para o caminho correto
          if (redirectPath === '/dashboard') {
            // Se for web, usar window.location para garantir que sai do PWA
            window.location.href = '/dashboard'
          } else {
            router.push(redirectPath)
          }
        }, 100)
      } else {
        // Login falhou
        console.error('[PWA Login] Falha no login:', data)
        showAuthError({
          error: "Credenciais inválidas",
          message: data.message || "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
        })
      }
    } catch (error: any) {
      console.error('[PWA Login] Erro no login:', error)
      
      // Verificar se é erro de conexão
      if (error.name === 'TypeError' && (
        error.message?.includes('fetch') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('ERR_NETWORK_CHANGED')
      )) {
        // Usar URL do backend configurada (porta 3001)
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
        let apiUrl = backendUrl
        if (apiUrl.endsWith('/api')) {
          apiUrl = apiUrl.replace(/\/api$/, '')
        }
        showNetworkError(() => {
          // Tentar novamente - criar um evento sintético
          const syntheticEvent = {
            preventDefault: () => {},
          } as React.FormEvent
          handleSubmit(syntheticEvent)
        }, apiUrl)
        
        // Mostrar mensagem adicional no console
        console.error('[PWA Login] Erro de conexão:', {
          message: error.message,
          apiUrl: apiUrl,
          loginUrl: '/api/auth/login',
          suggestion: 'Verifique se o backend está rodando na porta 3001 e acessível'
        })
      } else {
        showAuthError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Função para autenticação biométrica
  const handleBiometricLogin = async () => {
    setIsLoading(true)
    try {
      const success = await authenticateWithBiometric()
      if (success) {
        // Login biométrico bem-sucedido - redirecionamento já é feito no hook
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error)
      showAuthError({
        error: "Erro na autenticação biométrica",
        message: "Não foi possível autenticar com biometria. Tente novamente."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para configurar biometria
  const handleSetupBiometric = async () => {
    setIsLoading(true)
    try {
      const success = await setupBiometricAuth(formData.usuario)
      if (success) {
        setSetupBiometric(true)
        setShowBiometricOption(false)
      }
    } catch (error) {
      console.error('Erro ao configurar biometria:', error)
      showAuthError({
        error: "Erro ao configurar biometria",
        message: "Não foi possível configurar autenticação biométrica."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Não renderizar nada no servidor para evitar erro de hidratação
  // O cliente vai renderizar após a hidratação
  if (!isClient) {
    return null
  }
  
  // Mostrar loading enquanto verifica autenticação
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 relative mx-auto mb-4">
              {empresa.logo ? (
                <Image
                  src={empresa.logo}
                  alt={empresa.nome}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{empresa.nome || "IRBANA PWA"}</h1>
            <p className="text-gray-600">Sistema de Ponto e Assinatura</p>
          </div>

        {/* Status de conexão */}
        <div className="mb-6">
          <Alert className={isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
                {isOnline ? "Conectado" : "Desconectado - Modo offline"}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Formulário de login */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="usuario"
                    name="usuario"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={formData.usuario}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  <a
                    href="/pwa/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Opções de persistência de sessão */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberEmail"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="rememberEmail" className="text-sm text-gray-600">
                    Lembrar meu email
                  </Label>
                </div>
              </div>

              {/* Botão de autenticação biométrica */}
              {biometricAvailable && biometricConfigured && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Entrar com Biometria
                </Button>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Link de Debug */}
        <div className="mt-6 text-center">
          <a 
            href="/pwa/test-api" 
            className="text-sm text-blue-600 hover:underline"
          >
            🔧 Problemas com login? Clique aqui para diagnóstico
          </a>
        </div>
      </div>
      </div>
      
      {/* Footer com informações da empresa */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-gray-900">{empresa.razao_social || empresa.nome}</p>
            <p className="text-xs text-gray-600">{getEnderecoCompleto()}</p>
            <p className="text-xs text-gray-600">{getContatoCompleto()}</p>
            {empresa.horario_funcionamento && (
              <p className="text-xs text-gray-600">{empresa.horario_funcionamento}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">© {new Date().getFullYear()} - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>

      {/* Modal de configuração de biometria */}
      {showBiometricOption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-blue-600" />
                Configurar Autenticação Biométrica
              </CardTitle>
              <CardDescription>
                Configure autenticação biométrica para acesso mais rápido e seguro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fingerprint className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  Use sua biometria (impressão digital, Face ID, etc.) para fazer login mais rapidamente
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBiometricOption(false)}
                  className="flex-1"
                >
                  Agora não
                </Button>
                <Button
                  onClick={handleSetupBiometric}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Configurando...
                    </div>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Configurar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de sucesso na configuração */}
      {setupBiometric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Biometria Configurada!</h3>
                <p className="text-gray-600 mb-4">
                  Agora você pode usar autenticação biométrica para fazer login
                </p>
                <Button
                  onClick={() => {
                    setSetupBiometric(false)
                    router.push('/pwa')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function PWALoginPage() {
  return (
    <EmpresaProvider>
      <PWALoginPageContent />
    </EmpresaProvider>
  )
}
