"use client"

import { useState, useEffect } from "react"
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
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

export default function PWALoginPage() {
  const [formData, setFormData] = useState({
    usuario: "",
    senha: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return
      
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        // Já está autenticado, redirecionar para dashboard
        router.push('/pwa')
        return
      }
      
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Construir URL da API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const loginUrl = `${apiUrl}/api/auth/login`
      
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

      let data
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
        
        // Salvar dados do usuário
        if (data.data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.data.user))
        }
        
        // Salvar refresh token se existir
        if (data.data.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token)
        }

        console.log('[PWA Login] Login bem-sucedido!')

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo${data.data.user?.nome ? ', ' + data.data.user.nome : ''}!`,
          variant: "default"
        })
        
        // Pequeno delay para garantir que o localStorage foi salvo
        setTimeout(() => {
          router.push("/pwa")
        }, 100)
      } else {
        // Login falhou
        console.error('[PWA Login] Falha no login:', data)
        toast({
          title: "Credenciais inválidas",
          description: data.message || "Verifique seu usuário e senha",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('[PWA Login] Erro no login:', error)
      
      let errorMessage = "Não foi possível conectar ao servidor"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet ou a URL da API"
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IRBANA PWA</h1>
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
                <Label htmlFor="senha">Senha</Label>
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
  )
}
